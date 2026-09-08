"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { useApp } from "@/lib/store";
import { Widget, toolPartToWidgetType } from "./widgets/WidgetRenderer";
import { StatusWidget } from "./widgets/Widgets";
import { useRequestProgress } from "@/lib/demo/request";
import { RequestPinnedCard } from "@/components/demo/surfaces/RequestActivity";
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

// Sarah gets a bubble; Lumi speaks as plain text on the page. Per the Figma
// response screens — it reads as the app talking, not as a second person.
function TextBubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  if (role === "assistant") {
    return (
      <p className="whitespace-pre-line px-1 text-[16px] font-light leading-[22px] text-ink">
        {text}
      </p>
    );
  }
  return (
    <Row role="user">
      <div className="max-w-[82%] whitespace-pre-line rounded-[20px] bg-surface-muted px-4 py-2.5 text-[16px] font-light leading-[22px] text-ink">
        {text}
      </div>
    </Row>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-line-light" />
      <span className="text-[12px] font-light text-ink-faint">{label}</span>
      <span className="h-px flex-1 bg-line-light" />
    </div>
  );
}

// The "Ask Lumi" composer, read-only — the draft types itself in.
function Composer({ draft, placeholder }: { draft: string; placeholder: string }) {
  return (
    <div className="shrink-0 px-4 pb-6 pt-2">
      <div className="flex items-center gap-2 rounded-full bg-surface-muted py-2.5 pl-5 pr-2.5">
        <span className="min-h-[24px] flex-1 text-[16px] font-light leading-6 text-ink">
          {draft || <span className="text-ink-soft opacity-50">{placeholder}</span>}
          {draft && <span className="animate-pulse text-ink">|</span>}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eceae7]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-ink" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
            <path d="M18 11a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.9V22h2v-3.1A8 8 0 0 0 20 11h-2Z" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// ── StoryThreadView ───────────────────────────────────────────────────────────

export function StoryThreadView({ onClose }: { onClose?: () => void }) {
  const messages = useApp((s) => s.demo.storyChat.messages);
  const draft = useApp((s) => s.demo.storyChat.draft);
  const lumiTyping = useApp((s) => s.demo.storyChat.lumiTyping);
  const starters = useApp((s) => s.demo.starters);
  const request = useApp((s) => s.demo.request);
  const requestProgress = useRequestProgress(request);

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

  // The start screen holds while she types her first message — the draft lands
  // in the "Ask Lumi" field, and only sending turns this into a conversation.
  const isEmpty = messages.length === 0 && !lumiTyping;

  // ── Idle "Ask Lumi" start screen ───────────────────────────────────────────
  if (isEmpty && !request) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #fff4f6 55%, #ffe9ee 100%)" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG_LUMI_LARGE} alt="Lumi" className="w-[62%] max-w-[260px] object-contain" />
          <p className="mt-2 text-center text-[26px] font-semibold leading-[1.15] tracking-[-0.4px] text-ink">
            I&rsquo;m Lumi, your travel assistant
          </p>
        </div>

        {starters.length > 0 && (
          <div className="shrink-0 space-y-4 px-8 pb-2">
            {starters.map((s) => (
              <p key={s} className="text-[15px] font-light leading-5 text-ink">
                {s}
              </p>
            ))}
          </div>
        )}

        <Composer draft={draft} placeholder="Ask Lumi" />
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

      {/* Pinned live request — stays put while she asks the next thing, with a
          rule under it separating the status from the conversation (Figma).
          The rule sits in 40px of clear space on both sides. */}
      {request && requestProgress && (
        <div className="shrink-0 px-4 pt-2">
          <RequestPinnedCard request={request} progress={requestProgress} />
          <div className="mt-[40px] h-px bg-line-light" />
        </div>
      )}

      {/* Pinned status widget (seeded threads) */}
      {!request && pinnedStatus && (
        <div className="shrink-0 border-b border-line px-3.5 py-3">
          <StatusWidget data={pinnedStatus} />
        </div>
      )}

      {/* Message list — 40px of clear space under the rule when one is shown */}
      <div
        className={`min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 no-scrollbar app-scroll ${
          request && requestProgress ? "pt-[40px]" : "pt-4"
        }`}
      >
        {messages.map((message: UIMessage) => (
          <div key={message.id} className="space-y-3">
            {message.parts.map((part, idx) => {
              if (part.type === "text") {
                if (!part.text) return null;
                return <TextBubble key={idx} role={message.role as "user" | "assistant"} text={part.text} />;
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((part as any).type === "story-divider") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return <DateDivider key={idx} label={(part as any).text} />;
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
                      <div className="w-full">
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

      <Composer draft={draft} placeholder="Ask Lumi" />
    </div>
  );
}
