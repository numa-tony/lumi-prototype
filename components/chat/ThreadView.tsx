"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Composer } from "./Composer";
import { Widget, toolPartToWidgetType } from "./widgets/WidgetRenderer";
import { StatusWidget } from "./widgets/Widgets";
import { useApp } from "@/lib/store";
import type { ChatContext, PersistedThread, WidgetData } from "@/lib/types";
import type { StatusWidgetData } from "@/lib/types";

const IMG_LUMI_LARGE = "https://www.figma.com/api/mcp/asset/c5fa1451-f3c3-4672-bad0-97cc1122794d";

const STARTER_ICONS = [
  <svg key="a" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" /><path d="m9 9 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  <svg key="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" /><path d="M6 1v3M10 1v3M14 1v3" strokeLinecap="round" /></svg>,
  <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
];

// ── iOS keyboard visual ──────────────────────────────────────────────────────

const KEY = "flex items-center justify-center rounded-[5px] bg-white text-[17px] text-black shadow-[0_1px_0_rgba(0,0,0,0.32)] select-none active:bg-[#b0b8c4]";
const SPEC = "flex items-center justify-center rounded-[5px] bg-[#adb5bd] shadow-[0_1px_0_rgba(0,0,0,0.32)] select-none active:opacity-70";

function FakeKeyboard({ onKey }: { onKey: (k: string) => void }) {
  const tap = (k: string) => (e: React.MouseEvent) => {
    e.preventDefault(); // keep textarea focused
    onKey(k);
  };

  return (
    <div className="shrink-0 bg-[#d1d5db] px-[6px] pt-[6px]">
      {/* Autocorrect bar */}
      <div className="mb-[6px] flex h-[44px] items-center border-b border-[#bfc6ce]">
        {["\"The\"", "the", "to"].map((s, i) => (
          <div key={s} className="flex flex-1 items-center justify-center">
            {i > 0 && <div className="mr-2 h-[22px] w-px bg-[#bfc6ce]" />}
            <button onMouseDown={tap(s.replace(/"/g, "") + " ")} className="text-[17px] text-black">{s}</button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[10px] pb-[6px]">
        {/* Row 1 */}
        <div className="flex gap-[6px]">
          {["q","w","e","r","t","y","u","i","o","p"].map(k => (
            <button key={k} onMouseDown={tap(k)} className={`${KEY} h-[42px] flex-1`}>{k}</button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-[6px] px-[18px]">
          {["a","s","d","f","g","h","j","k","l"].map(k => (
            <button key={k} onMouseDown={tap(k)} className={`${KEY} h-[42px] flex-1`}>{k}</button>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex gap-[6px]">
          <button onMouseDown={tap("⇧")} className={`${SPEC} h-[42px] w-[43px] text-[18px]`}>⇧</button>
          <div className="flex flex-1 gap-[6px]">
            {["z","x","c","v","b","n","m"].map(k => (
              <button key={k} onMouseDown={tap(k)} className={`${KEY} h-[42px] flex-1`}>{k}</button>
            ))}
          </div>
          <button onMouseDown={tap("backspace")} className={`${SPEC} h-[42px] w-[43px]`}>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M7 1H18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7L1 8l6-7Z" strokeLinejoin="round" />
              <path d="m8 5.5 5 5M13 5.5l-5 5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Row 4 */}
        <div className="flex gap-[6px]">
          <button onMouseDown={(e) => e.preventDefault()} className={`${SPEC} h-[42px] w-[90px] text-[15px]`}>123</button>
          <button onMouseDown={tap(" ")} className={`${KEY} h-[42px] flex-1 text-[15px] text-[#888]`}>space</button>
          <button
            onMouseDown={tap("return")}
            className="flex h-[42px] w-[90px] items-center justify-center rounded-[5px] bg-[#007AFF] text-[17px] text-white shadow-[0_1px_0_rgba(0,0,0,0.32)] select-none"
          >
            return
          </button>
        </div>
      </div>

      {/* Emoji + mic row */}
      <div className="flex items-center justify-between px-[36px] py-[10px]">
        <button onMouseDown={(e) => e.preventDefault()} className="text-[24px] leading-none">🙂</button>
        <button onMouseDown={(e) => e.preventDefault()}>
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="6" y="1" width="8" height="14" rx="4" />
            <path d="M2 12a8 8 0 0 0 16 0M10 20v7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Idle input card ──────────────────────────────────────────────────────────

function IdleInput({
  onSend,
  focused,
  onFocus,
}: {
  onSend: (text: string) => void;
  focused: boolean;
  onFocus: () => void;
}) {
  const openVoice = useApp((s) => s.openVoice);
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onSend(t);
    setValue("");
  };

  const handleKey = (k: string) => {
    if (k === "backspace") setValue((v) => v.slice(0, -1));
    else if (k === "return") submit();
    else if (k === "⇧") { /* ignore */ }
    else setValue((v) => v + k);
  };

  return (
    <>
      {/* Input card */}
      <div className="mx-4 mb-6 rounded-[24px] bg-surface p-4 shadow-[0px_10px_40px_rgba(0,0,0,0.1)]">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          rows={1}
          placeholder="Ask anything"
          className="mb-4 w-full resize-none bg-transparent text-[16px] font-light leading-snug text-ink outline-none placeholder:text-ink-soft"
        />
        <div className="flex items-center justify-between">
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-faint active:bg-surface-muted" aria-label="Attach">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {focused ? (
            <button type="button" onClick={submit} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface active:opacity-75" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { onFocus(); ref.current?.focus(); }} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-faint active:bg-surface-muted" aria-label="Voice">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
                </svg>
              </button>
              <button type="button" onClick={openVoice} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[15px] font-semibold text-surface active:opacity-75">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="3" y="6" width="2" height="12" rx="1" />
                  <rect x="7" y="3" width="2" height="18" rx="1" />
                  <rect x="11" y="7" width="2" height="10" rx="1" />
                  <rect x="15" y="4" width="2" height="16" rx="1" />
                  <rect x="19" y="8" width="2" height="8" rx="1" />
                </svg>
                Speak
              </button>
            </div>
          )}
        </div>
      </div>

      {/* iOS keyboard — visual mockup, real keyboard still works */}
      {focused && <FakeKeyboard onKey={handleKey} />}
    </>
  );
}

// ── Thread rows ──────────────────────────────────────────────────────────────

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

function WidgetRow({ data, onRespond }: { data: WidgetData; onRespond: (t: string) => void }) {
  return (
    <Row role="assistant">
      <div className="w-[92%]">
        <Widget type={data.type} data={data.data} onRespond={onRespond} />
      </div>
    </Row>
  );
}

// ── ThreadView ───────────────────────────────────────────────────────────────

export function ThreadView({
  context,
  thread,
  onClose,
}: {
  context: ChatContext;
  thread?: PersistedThread | undefined;
  onClose?: () => void;
}) {
  const createThread = useApp((s) => s.createThread);
  const saveThreadMessages = useApp((s) => s.saveThreadMessages);
  const renameThread = useApp((s) => s.renameThread);

  // Stash the thread id this chat is bound to. For an existing thread we have
  // it from the start; for a fresh FAB chat it's null until the user sends
  // their first message (then we lazily createThread()).
  const threadIdRef = useRef<string | null>(thread?.id ?? null);
  // Avoid calling renameThread on every render once the AI has set a topic.
  const namedRef = useRef<boolean>(false);

  const { messages, sendMessage, status } = useChat({
    messages: thread?.messages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { hint: context.hint },
    }),
    onFinish: ({ messages: latest }) => {
      if (threadIdRef.current) {
        saveThreadMessages(threadIdRef.current, latest);
      }
    },
  });

  const send = (text: string) => {
    if (!threadIdRef.current) {
      threadIdRef.current = createThread(text);
    }
    sendMessage({ text });
  };

  // React to setThreadTopic tool calls: rename the inbox row + swap the emoji.
  useEffect(() => {
    if (namedRef.current) return;
    if (!threadIdRef.current) return;
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type !== "tool-setThreadTopic") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any;
        if (p.state !== "output-available") continue;
        const { topic, emoji } = p.output ?? {};
        if (typeof topic === "string" || typeof emoji === "string") {
          renameThread(threadIdRef.current, topic ?? "", emoji);
          namedRef.current = true;
        }
        return;
      }
    }
  }, [messages, renameThread]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Pin any active (non-resolved) statusWidget to the top of the thread view.
  const pinnedStatus = useMemo((): StatusWidgetData | null => {
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type !== "tool-statusWidget") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any;
        if (p.state !== "output-available") continue;
        if (p.output?.state === "resolved") continue;
        return p.output as StatusWidgetData;
      }
    }
    return null;
  }, [messages]);

  const [inputFocused, setInputFocused] = useState(false);
  const [aiStarters, setAiStarters] = useState<string[] | null>(null);
  const [startersLoading, setStartersLoading] = useState(false);
  const startersFetchedRef = useRef(false);
  const isEmpty = messages.length === 0;

  // Fetch AI-generated starters once when keyboard mode opens
  useEffect(() => {
    if (!inputFocused || !isEmpty || startersFetchedRef.current) return;
    if (!context.hint) return;
    startersFetchedRef.current = true;
    setStartersLoading(true);
    fetch("/api/starters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hint: context.hint }),
    })
      .then((r) => r.json())
      .then(({ starters }: { starters: string[] }) => {
        if (starters?.length) setAiStarters(starters);
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setStartersLoading(false));
  }, [inputFocused, isEmpty, context.hint]);

  if (isEmpty) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {inputFocused ? (
          /* Keyboard mode: Numa + suggestion starters */
          <div className="flex flex-1 flex-col px-4 pt-6">
            <p className="text-center text-[28px] font-semibold tracking-[-0.5px] text-ink">Numa</p>
            <div className="mt-auto flex flex-col gap-5 pb-4 pl-6">
              {startersLoading
                ? [0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="shrink-0 text-ink-soft opacity-30">{STARTER_ICONS[i]}</span>
                      <div className={`h-[18px] animate-pulse rounded-full bg-surface-muted ${i === 0 ? "w-48" : i === 1 ? "w-40" : "w-44"}`} />
                    </div>
                  ))
                : (aiStarters ?? context.starters ?? []).slice(0, 3).map((s, i) => (
                    <button key={s} onClick={() => send(s)} className="flex items-center gap-4 text-left active:opacity-60">
                      <span className="shrink-0 text-ink-soft">{STARTER_ICONS[i % STARTER_ICONS.length]}</span>
                      <span className="text-[16px] font-light tracking-[-0.2px] text-ink-soft">{s}</span>
                    </button>
                  ))
              }
            </div>
          </div>
        ) : (
          /* Idle mode: Numa + large Lumi orb */
          <div className="flex flex-1 flex-col items-center pt-6">
            <p className="text-[28px] font-semibold tracking-[-0.5px] text-ink">Numa</p>
            <div className="flex flex-1 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG_LUMI_LARGE} alt="Lumi" className="w-[68%] max-w-[300px] object-contain" />
            </div>
          </div>
        )}

        <IdleInput
          onSend={send}
          focused={inputFocused}
          onFocus={() => setInputFocused(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* header */}
      <div className="relative flex shrink-0 items-center justify-center px-4 py-2.5">
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          {thread ? thread.topic : "Lumi"}
        </span>
        {onClose && (
          <button onClick={onClose} className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink active:scale-95" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="h-px shrink-0 bg-line" />

      {/* Pinned status widget — shown at top when active (not resolved) */}
      {pinnedStatus && (
        <div className="shrink-0 border-b border-line px-3.5 py-3">
          <StatusWidget data={pinnedStatus} />
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-4 no-scrollbar app-scroll">
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {message.parts.map((part, idx) => {
              if (part.type === "text") {
                if (!part.text) return null;
                return <TextBubble key={idx} role={message.role as "user" | "assistant"} text={part.text} />;
              }
              // setThreadTopic is metadata-only — never render it.
              if (part.type === "tool-setThreadTopic") return null;
              const wtype = toolPartToWidgetType(part.type);
              if (wtype) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = part as any;
                if (p.state === "output-available") {
                  // Skip statusWidget inline when it's pinned at the top
                  if (wtype === "statusWidget" && pinnedStatus && p.output?.state !== "resolved") return null;
                  return (
                    <Row key={idx} role="assistant">
                      <div className="w-[92%]"><Widget type={wtype} data={p.output} onRespond={send} /></div>
                    </Row>
                  );
                }
                if (p.state === "output-error") {
                  return <p key={idx} className="px-1 text-[12px] text-ink-faint">(couldn&apos;t load that)</p>;
                }
                return null;
              }
              return null;
            })}
          </div>
        ))}

        {status === "submitted" && (
          <Row role="assistant">
            <div className="lumi-typing flex items-center gap-1 rounded-2xl border border-line bg-surface px-4 py-3">
              <span /> <span /> <span />
            </div>
          </Row>
        )}

        {status === "error" && (
          <p className="px-1 text-center text-[12px] text-numa">
            Lumi had trouble responding. Check the API key and try again.
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <Composer onSend={send} disabled={status === "submitted" || status === "streaming"} />
    </div>
  );
}
