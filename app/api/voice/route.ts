import { generateText, type UserModelMessage } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { audioBase64, mimeType }: { audioBase64: string; mimeType: string } =
    await req.json();

  // Strip codec info — Gemini only needs the base MIME type
  const baseMimeType = mimeType.split(";")[0];

  const message: UserModelMessage = {
    role: "user",
    content: [
      {
        type: "file",
        data: Buffer.from(audioBase64, "base64"),
        mediaType: baseMimeType,
      },
      {
        type: "text",
        text: "Transcribe this audio verbatim. Reply with only the transcription — no commentary, no quotes, no punctuation notes. Just what was said.",
      },
    ],
  };

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    messages: [message],
  });

  return Response.json({ transcript: text.trim() });
}
