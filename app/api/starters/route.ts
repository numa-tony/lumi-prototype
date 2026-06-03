import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 15;

export async function POST(req: Request) {
  const { hint } = await req.json() as { hint: string };

  const { text } = await generateText({
    model: google("gemini-2.0-flash-lite"),
    prompt: `You are Lumi, the AI concierge for Numa Stays.

Context about the guest right now: ${hint}

Generate exactly 3 short conversation starters a guest might tap to begin chatting with you. Requirements:
- Maximum 7 words each
- Natural, spoken phrasing — like tapping a chip
- No punctuation at the end
- Directly relevant to the context above

Reply with ONLY a JSON array of exactly 3 strings. No other text, no markdown.`,
  });

  try {
    const parsed = JSON.parse(text.trim()) as string[];
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return Response.json({ starters: parsed.slice(0, 3) });
    }
  } catch {
    // fall through to line extraction
  }

  // Fallback: strip list markers and extract up to 3 non-empty lines
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[\s\-\d.)"]+(.*?)["'\s,]*$/, "$1").trim())
    .filter(Boolean);

  return Response.json({ starters: lines.slice(0, 3) });
}
