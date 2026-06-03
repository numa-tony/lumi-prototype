import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { text }: { text: string } = await req.json();

  const result = await generateText({
    model: google("gemini-2.5-flash-preview-tts"),
    prompt: text,
    providerOptions: {
      google: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    },
  });

  const audioFile = result.files.find((f) => f.mediaType.startsWith("audio/"));
  if (!audioFile) {
    return Response.json({ error: "No audio generated" }, { status: 500 });
  }

  const buffer = Buffer.from(audioFile.base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": audioFile.mediaType,
      "Content-Length": String(buffer.length),
    },
  });
}
