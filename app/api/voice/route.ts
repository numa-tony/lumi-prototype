// STT via Groq Whisper — uses the GROQ_API_KEY already in .env.local.
// Falls back to Gemini if Groq key is absent.
import { generateText, type UserModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { isRateLimitMessage, markRateLimited } from "@/lib/ai/model";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { audioBase64, mimeType }: { audioBase64: string; mimeType: string } =
    await req.json();

  const baseMimeType = mimeType.split(";")[0];
  const groqKey = process.env.GROQ_API_KEY;

  // ── Primary: Groq Whisper ──────────────────────────────────────────────────
  if (groqKey) {
    try {
      const audioBuffer = Buffer.from(audioBase64, "base64");
      const form = new FormData();
      form.append("file", new Blob([audioBuffer], { type: baseMimeType }), "audio.wav");
      form.append("model", "whisper-large-v3-turbo");
      form.append("response_format", "json");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: form,
      });

      if (res.ok) {
        const { text } = (await res.json()) as { text: string };
        return Response.json({ transcript: text.trim() });
      }

      const msg = await res.text();
      console.error("[voice] Groq Whisper error:", res.status, msg);
      if (res.status === 429) {
        return Response.json({ error: "Rate limit reached" }, { status: 429 });
      }
      // Non-429 Groq error → fall through to Gemini
    } catch (err) {
      console.error("[voice] Groq Whisper threw:", err instanceof Error ? err.message : err);
      // Fall through to Gemini
    }
  }

  // ── Fallback: Gemini STT ───────────────────────────────────────────────────
  const message: UserModelMessage = {
    role: "user",
    content: [
      { type: "file", data: Buffer.from(audioBase64, "base64"), mediaType: baseMimeType },
      { type: "text", text: "Transcribe this audio verbatim. Reply with only the transcription — no commentary, no quotes, no punctuation notes. Just what was said." },
    ],
  };

  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [message],
    });
    return Response.json({ transcript: text.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[voice] Gemini STT error:", msg);
    if (isRateLimitMessage(msg)) {
      markRateLimited("gemini-2.0-flash");
      return Response.json({ error: "Rate limit reached" }, { status: 429 });
    }
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}
