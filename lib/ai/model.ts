import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { Redis } from "@upstash/redis";
import type { LanguageModel } from "ai";

// ---------------------------------------------------------------------------
// Multi-provider fallback chain.
// Cooldowns persist to Redis (Upstash) so cold-starts don't reset them.
//
// Required env vars (add the ones you have — unused entries are skipped):
//   GOOGLE_GENERATIVE_AI_API_KEY    — Gemini primary  (aistudio.google.com/apikey)
//   GOOGLE_GENERATIVE_AI_API_KEY_2  — Gemini secondary (second Google account)
//   GROQ_API_KEY                    — Groq key 1   (console.groq.com)
//   GROQ_API_KEY_2                  — Groq key 2   (optional, extends quota)
// ---------------------------------------------------------------------------

interface ModelSlot {
  id: string;
  factory: () => LanguageModel;
  available: () => boolean;
}

function getRedis(): Redis | null {
  try { return Redis.fromEnv(); } catch { return null; }
}

const groq1 = process.env.GROQ_API_KEY
  ? createGroq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const groq2 = process.env.GROQ_API_KEY_2
  ? createGroq({ apiKey: process.env.GROQ_API_KEY_2 })
  : null;

const google2 = process.env.GOOGLE_GENERATIVE_AI_API_KEY_2
  ? createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY_2 })
  : null;

const MODEL_CHAIN: ModelSlot[] = [
  {
    id: "gemini-2.5-flash-lite",
    factory: () => google("gemini-2.5-flash-lite"),
    available: () => !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  {
    id: "groq-qwen3-32b",
    factory: () => groq1!("qwen/qwen3-32b"),
    available: () => !!groq1,
  },
  {
    id: "groq-llama-3.3-70b",
    factory: () => groq1!("llama-3.3-70b-versatile"),
    available: () => !!groq1,
  },
  {
    id: "groq2-llama-3.3-70b",
    factory: () => groq2!("llama-3.3-70b-versatile"),
    available: () => !!groq2,
  },
  {
    id: "gemini2-2.5-flash-lite",
    factory: () => google2!("gemini-2.5-flash-lite"),
    available: () => !!google2,
  },
  {
    id: "groq-llama-3.1-8b",
    factory: () => groq1!("llama-3.1-8b-instant"),
    available: () => !!groq1,
  },
];

// In-memory cooldown store — seeded from Redis on first call after a cold start.
// Key: slot id, Value: timestamp when it's safe to use again.
const cooldowns = new Map<string, number>();
let seededFromRedis = false;

export function isRateLimitMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("quota") ||
    m.includes("resource_exhausted") ||
    m.includes("rate limit") ||
    m.includes("rate_limit") ||
    m.includes("too many")
  );
}

// Parse error message to determine the right cooldown duration.
// Daily/hourly exhaustion needs hours, per-minute needs only 90s.
export function getRateLimitCooldown(msg: string): number {
  const m = msg.toLowerCase();
  if (
    m.includes("per day") ||
    m.includes("per_day") ||
    m.includes("daily") ||
    m.includes("day limit") ||
    m.includes("requests per hour") ||
    m.includes("per hour")
  ) {
    return 6 * 60 * 60 * 1000; // 6h for daily/hourly exhaustion
  }
  return 90_000; // 90s for per-minute limits
}

export function markRateLimited(modelId: string, cooldownMs = 90_000): void {
  const expiresAt = Date.now() + cooldownMs;
  cooldowns.set(modelId, expiresAt);
  console.log(`[model] ${modelId} rate-limited — ${cooldownMs / 1000}s cooldown`);
  // Persist to Redis so the cooldown survives serverless cold-starts (fire-and-forget)
  const redis = getRedis();
  if (redis) {
    void redis.set(`rl:${modelId}`, expiresAt, { ex: Math.ceil(cooldownMs / 1000) });
  }
}

export async function getModel(): Promise<{ model: LanguageModel; id: string }> {
  const now = Date.now();
  const redis = getRedis();

  // On the first call after a cold-start, seed in-memory from Redis
  // so we don't retry a model that another invocation already exhausted.
  if (!seededFromRedis) {
    seededFromRedis = true;
    if (redis) {
      try {
        await Promise.all(
          MODEL_CHAIN.map(async (s) => {
            const val = await redis.get<number>(`rl:${s.id}`);
            if (val && val > now) cooldowns.set(s.id, val);
          })
        );
      } catch { /* Redis unavailable — continue with empty cooldowns */ }
    }
  }

  const available = MODEL_CHAIN.filter((s) => s.available());
  if (available.length === 0) throw new Error("No AI provider configured");

  // Pick the first slot whose cooldown has expired
  for (const slot of available) {
    if (now >= (cooldowns.get(slot.id) ?? 0)) {
      return { model: slot.factory(), id: slot.id };
    }
  }

  // All slots are cooling down — use whichever cooldown expires soonest
  const soonest = available.reduce((a, b) =>
    (cooldowns.get(a.id) ?? 0) < (cooldowns.get(b.id) ?? 0) ? a : b,
  );
  console.log(`[model] all providers cooling, forcing ${soonest.id}`);
  cooldowns.delete(soonest.id);
  if (redis) void redis.del(`rl:${soonest.id}`);
  return { model: soonest.factory(), id: soonest.id };
}
