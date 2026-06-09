import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { getModel, markRateLimited, isRateLimitMessage, getRateLimitCooldown } from "@/lib/ai/model";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { tools } from "@/lib/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, hint }: { messages: UIMessage[]; hint?: string } =
    await req.json();

  const { model, id: modelId } = await getModel();
  const isWhatsApp = hint?.toLowerCase().includes("whatsapp") ?? false;

  // Strip controlDevice from WhatsApp requests — room controls are app-only
  const activeTools = isWhatsApp
    ? Object.fromEntries(Object.entries(tools).filter(([k]) => k !== "controlDevice"))
    : tools;

  try {
    const result = streamText({
      model,
      system: buildSystemPrompt(hint),
      messages: await convertToModelMessages(messages),
      tools: activeTools,
      stopWhen: stepCountIs(5),
      onError: ({ error }) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (isRateLimitMessage(msg)) markRateLimited(modelId, getRateLimitCooldown(msg));
        console.error(`[chat] ${modelId} stream error:`, msg);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isRateLimitMessage(msg)) markRateLimited(modelId, getRateLimitCooldown(msg));
    return new Response(isRateLimitMessage(msg) ? "Rate limit reached" : "AI error", {
      status: isRateLimitMessage(msg) ? 429 : 500,
    });
  }
}
