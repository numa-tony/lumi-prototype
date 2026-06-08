import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const REDIS_KEY = "lumi-todos";

// Redis.fromEnv() reads KV_REST_API_URL + KV_REST_API_TOKEN (Vercel Marketplace)
// or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (manual setup) — both work.
function getRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ overrides: [], deleted: [] });

  const data = await redis.get(REDIS_KEY);
  return NextResponse.json(data ?? { overrides: [], deleted: [] });
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: false, reason: "not configured" }, { status: 503 });
  }

  const body = await req.json();
  await redis.set(REDIS_KEY, body);
  return NextResponse.json({ ok: true });
}
