import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { getModel } from "@/lib/ai/model";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { tools } from "@/lib/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, hint }: { messages: UIMessage[]; hint?: string } =
    await req.json();

  const result = streamText({
    model: getModel(),
    system: buildSystemPrompt(hint),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
