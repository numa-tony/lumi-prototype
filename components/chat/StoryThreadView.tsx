"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { Widget, toolPartToWidgetType } from "./widgets/WidgetRenderer";
import { StatusWidget } from "./widgets/Widgets";
import type { StatusWidgetData } from "@/lib/types";

const IMG_LUMI_LARGE = "/lumi-torus.png";

// ── Shared row + bubble primitives ───────────────────────────────────────────

function Row({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      {children}
    </div>
  );
}

function TextBubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <Row role={role}>
      <div className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${role === "user" ? "bg-surface-muted text-ink" : "border border-line bg-surface text-ink"}`}>
        {text}
      </div>
    </Row>
  );
}

// ── StoryThreadView ───────────────────────────────────────────────────────────

export function StoryThreadView({ onClose }: { onClose?: () => void }) {
  const messages = useApp((s) => s.demo.storyChat.messages);
  const draft = useApp((s) => s.demo.storyChat.draft);
  const lumiTyping = useApp((s) => s.demo.storyChat.lumiTyping);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lumiTyping]);

  // Pin most recent statusWidget (same logic as ThreadView)
  let pinnedStatus: StatusWidgetData | null = null;
  for (const m of messages) {
    for (const part of m.parts) {
      if (part.type !== "tool-statusWidget") continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any;
      if (p.state !== "output-available") continue;
      pinnedStatus = p.output as StatusWidgetData;
    }
  }

  const isEmpty = messages.length === 0 && !draft && !lumiTyping;

  if (isEmpty) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Idle state — Numa wordmark + Lumi orb */}
        <div className="flex flex-1 flex-col items-center pt-6">
          <p className="text-[28px] font-semibold tracking-[-0.5px] text-ink">Numa</p>
          <div className="flex flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_LUMI_LARGE} alt="Lumi" className="w-[68%] max-w-[300px] object-contain" />
          </div>
        </div>
        {/* Fake input card — read-only during story, draft goes here */}
        <div className="mx-4 mb-6 rounded-[24px] bg-surface p-4 shadow-[0px_10px_40px_rgba(0,0,0,0.1)]">
          <div className="mb-4 min-h-[24px] w-full text-[16px] font-light leading-snug text-ink-soft">
            {draft || <span className="opacity-40">Ask anything</span>}
          </div>
          <div className="flex items-center justify-end">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink opacity-30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="relative flex shrink-0 items-center justify-center px-4 py-2.5">
        <span className="text-[17px] font-semibold tracking-tight text-ink">Lumi</span>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink active:scale-95"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="h-px shrink-0 bg-line" />

      {/* Pinned status widget */}
      {pinnedStatus && (
        <div className="shrink-0 border-b border-line px-3.5 py-3">
          <StatusWidget data={pinnedStatus} />
        </div>
      )}

      {/* Message list */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-4 no-scrollbar app-scroll">
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {message.parts.map((part, idx) => {
              if (part.type === "text") {
                if (!part.text) return null;
                return <TextBubble key={idx} role={message.role as "user" | "assistant"} text={part.text} />;
              }
              if (part.type === "tool-setThreadTopic") return null;
              if (part.type === "tool-controlDevice") return null;
              const wtype = toolPartToWidgetType(part.type);
              if (wtype) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = part as any;
                if (p.state === "output-available") {
                  if (wtype === "statusWidget" && pinnedStatus) return null;
                  return (
                    <Row key={idx} role="assistant">
                      <div className="w-[92%]">
                        <Widget type={wtype} data={p.output} onRespond={() => {}} />
                      </div>
                    </Row>
                  );
                }
                return null;
              }
              return null;
            })}
          </div>
        ))}

        {/* Lumi typing dots */}
        {lumiTyping && (
          <Row role="assistant">
            <div className="lumi-typing flex items-center gap-1 rounded-2xl border border-line bg-surface px-4 py-3">
              <span /> <span /> <span />
            </div>
          </Row>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fake composer — shows typewriter draft, read-only */}
      <div className="shrink-0 border-t border-line bg-surface px-3 py-2">
        <div className="flex items-center gap-2 rounded-2xl bg-surface-muted px-4 py-2.5">
          <span className="min-h-[20px] flex-1 text-[15px] font-light text-ink">
            {draft || <span className="text-ink-soft opacity-40">Message</span>}
            {draft && <span className="animate-pulse text-ink">|</span>}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden>
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
