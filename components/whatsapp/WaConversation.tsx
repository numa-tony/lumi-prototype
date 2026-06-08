"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useApp } from "@/lib/store";
import { WaBubble } from "./WaBubble";
import { WaTopicSection } from "./WaTopicSection";
import { WaComposer } from "./WaComposer";

const WA_HINT = `You are Lumi, Numa's AI concierge, responding via WhatsApp.
The guest is Sarah Klein, currently staying at Numa Berlin Novela, room 204, door code 2930.
Keep WhatsApp replies SHORT — 1 to 3 sentences max. No markdown, no bullet lists.
Always call setThreadTopic at the start of your FIRST reply on a new subject.
Topic = 2 words max (e.g. "Towels", "AC", "Ramen", "Late checkout").
Emoji = most relevant single emoji for the topic.`;

type DisplayItem =
  | { kind: "message"; message: UIMessage }
  | { kind: "marker"; id: string; emoji: string; topic: string };

// Build display list interleaving markers after their anchor messages.
function buildDisplayList(
  messages: UIMessage[],
  markers: Array<{ id: string; threadId: string; topic: string; emoji: string; afterMessageId: string }>,
): DisplayItem[] {
  const result: DisplayItem[] = [];
  const byAnchor = new Map<string, typeof markers>();

  for (const m of markers) {
    const arr = byAnchor.get(m.afterMessageId) ?? [];
    arr.push(m);
    byAnchor.set(m.afterMessageId, arr);
  }

  for (const m of byAnchor.get("__start__") ?? []) {
    result.push({ kind: "marker", id: m.id, emoji: m.emoji, topic: m.topic });
  }

  for (const msg of messages) {
    result.push({ kind: "message", message: msg });
    for (const m of byAnchor.get(msg.id) ?? []) {
      result.push({ kind: "marker", id: m.id, emoji: m.emoji, topic: m.topic });
    }
  }

  return result;
}

export function WaConversation() {
  const wa = useApp((s) => s.wa);
  const saveWaMessages = useApp((s) => s.saveWaMessages);
  const appendWaMessages = useApp((s) => s.appendWaMessages);
  const addWaMarker = useApp((s) => s.addWaMarker);
  const beginWaThread = useApp((s) => s.beginWaThread);
  const setWaActiveThread = useApp((s) => s.setWaActiveThread);
  const setWaPendingText = useApp((s) => s.setWaPendingText);
  const saveThreadMessages = useApp((s) => s.saveThreadMessages);
  const renameThread = useApp((s) => s.renameThread);

  const activeThreadIdRef = useRef<string | null>(wa.activeThreadId);
  const namedRef = useRef<boolean>(false);
  const lastTopicRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize namedRef from persisted state on mount
  useEffect(() => {
    if (wa.activeThreadId) {
      const hasMarker = wa.markers.some((m) => m.threadId === wa.activeThreadId);
      namedRef.current = hasMarker;
      if (hasMarker) {
        const marker = wa.markers.find((m) => m.threadId === wa.activeThreadId);
        lastTopicRef.current = marker?.topic ?? "";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { messages, setMessages, sendMessage, status } = useChat({
    messages: wa.messages.length > 0 ? wa.messages : undefined,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { hint: WA_HINT },
    }),
    onFinish: ({ messages: latest }) => {
      saveWaMessages(latest);
      if (activeThreadIdRef.current) {
        saveThreadMessages(activeThreadIdRef.current, latest);
      }
    },
  });

  // When store messages change externally (ops-update, outbound), sync useChat display
  useEffect(() => {
    if (wa.messages !== messages) {
      setMessages(wa.messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wa.messages]);

  // Drain pendingGuestText set by scenario buttons
  useEffect(() => {
    if (!wa.pendingGuestText) return;
    const text = wa.pendingGuestText;
    setWaPendingText(null);
    send(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wa.pendingGuestText]);

  // Watch for setThreadTopic tool calls — same pattern as ThreadView
  useEffect(() => {
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type !== "tool-setThreadTopic") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any;
        if (p.state !== "output-available") continue;
        const { topic, emoji } = p.output ?? {};
        if (!topic && !emoji) return;

        if (!namedRef.current) {
          if (activeThreadIdRef.current) {
            renameThread(activeThreadIdRef.current, topic ?? "", emoji);
            const lastUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
            addWaMarker({
              threadId: activeThreadIdRef.current,
              topic: topic ?? "",
              emoji: emoji ?? "💬",
              afterMessageId: lastUserMsg?.id ?? "__start__",
            });
            namedRef.current = true;
            lastTopicRef.current = topic ?? "";
          }
        } else if (topic && topic !== lastTopicRef.current) {
          // Topic switch — new Lumi thread
          const lastUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
          if (lastUserMsg) {
            const newId = beginWaThread(lastUserMsg.id);
            activeThreadIdRef.current = newId;
            renameThread(newId, topic ?? "", emoji);
            addWaMarker({
              threadId: newId,
              topic: topic ?? "",
              emoji: emoji ?? "💬",
              afterMessageId: lastUserMsg.id,
            });
            lastTopicRef.current = topic ?? "";
          }
        }
        return;
      }
    }
  }, [messages, renameThread, addWaMarker, beginWaThread]);

  // Sync activeThreadId ref when store resets it
  useEffect(() => {
    if (wa.activeThreadId === null) {
      activeThreadIdRef.current = null;
      namedRef.current = false;
      lastTopicRef.current = "";
    }
  }, [wa.activeThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const send = useCallback(
    (text: string) => {
      if (!activeThreadIdRef.current) {
        const id = beginWaThread(text);
        activeThreadIdRef.current = id;
        namedRef.current = false;
        lastTopicRef.current = "";
      }
      sendMessage({ text });
    },
    [beginWaThread, sendMessage],
  );

  const displayList = useMemo(
    () => buildDisplayList(messages, wa.markers),
    [messages, wa.markers],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] py-3 no-scrollbar">
        {displayList.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
            <div className="text-4xl">💬</div>
            <p className="px-8 text-[13px] text-[#8a8a8a]">
              Use the scenario buttons in Settings to walk through Sarah&apos;s day
            </p>
          </div>
        )}

        {displayList.map((item) => {
          if (item.kind === "marker") {
            return <WaTopicSection key={item.id} emoji={item.emoji} topic={item.topic} />;
          }
          return <WaBubble key={item.message.id} message={item.message} />;
        })}

        {status === "submitted" && (
          <div className="flex px-3 py-1">
            <div className="rounded-[8px] rounded-tl-none bg-white px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#aaa]"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <WaComposer onSend={send} disabled={status === "submitted" || status === "streaming"} />
    </div>
  );
}
