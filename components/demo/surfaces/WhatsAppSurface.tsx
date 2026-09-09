"use client";

// Sarah's problem starts where every guest's problem starts: WhatsApp.
// A presentational iOS WhatsApp thread — scripted only, nothing is interactive.

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { useApp } from "@/lib/store";

const WA_GREEN = "#d9fdd3";
const WA_BG = "#efe7de";

function partText(m: UIMessage, type: string): string | undefined {
  for (const p of m.parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = p as any;
    if (any.type === type) return any.text as string;
  }
  return undefined;
}

function Ticks() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="shrink-0" aria-hidden>
      <path d="M1 6l2.6 2.6L9 3.2" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.4 6L9 8.6 14.4 3.2" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bubble({ message }: { message: UIMessage }) {
  const mine = message.role === "user";
  const text = partText(message, "text") ?? "";
  const link = partText(message, "story-link");
  const time = partText(message, "story-time");

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[82%] rounded-[10px] px-2.5 pb-[18px] pt-1.5 text-[16px] leading-[21px] text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          mine ? "rounded-tr-[3px]" : "rounded-tl-[3px]"
        }`}
        style={{ background: mine ? WA_GREEN : "#ffffff" }}
      >
        <span>{text}</span>
        {link && (
          <>
            <br />
            <span className="text-[#027eb5] underline decoration-[#027eb5]/40">{link}</span>{" "}
            <span className="text-[13px]">🔗</span>
          </>
        )}
        <span className="absolute bottom-[3px] right-2.5 flex items-center gap-1 text-[11px] text-[#667781]">
          {time}
          {mine && <Ticks />}
        </span>
      </div>
    </div>
  );
}

export function WhatsAppSurface() {
  const messages = useApp((s) => s.demo.waChat.messages);
  const draft = useApp((s) => s.demo.waChat.draft);
  const typing = useApp((s) => s.demo.waChat.lumiTyping);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="absolute inset-0 z-[45] flex flex-col overflow-hidden bg-[#f6f6f6]">
      {/* status bar */}
      <div className="relative flex h-12 shrink-0 items-end justify-between px-7 pb-1 text-ink">
        <span className="text-[15px] font-semibold tracking-tight">9:41</span>
        <div className="pointer-events-none absolute left-1/2 top-2.5 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center gap-1.5">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 4.5} y={8 - i * 2.5} width="3" height={4 + i * 2.5} rx="1" fill="currentColor" />
            ))}
          </svg>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
            <path d="M8.5 11.2 6.3 8.5a3.4 3.4 0 0 1 4.4 0L8.5 11.2Z" />
            <path d="M3.8 5.6a7.2 7.2 0 0 1 9.4 0l-1.5 1.8a4.9 4.9 0 0 0-6.4 0L3.8 5.6Z" />
            <path d="M1.4 2.9a10.8 10.8 0 0 1 14.2 0l-1.5 1.8a8.5 8.5 0 0 0-11.2 0L1.4 2.9Z" />
          </svg>
          <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
            <rect x="24" y="4" width="1.6" height="5" rx="0.8" fill="currentColor" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* chat header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#dcdcdc] bg-[#f6f6f6] px-3 pb-2.5 pt-1">
        <button className="flex items-center gap-0.5 text-[#007aff]" aria-hidden>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2 2 10l8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px]">12</span>
        </button>
        {/* Numa's WhatsApp avatar — brand pink with the N, not a bare circle */}
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ background: "var(--color-lumi-pink)" }}
        >
          <span className="text-[21px] font-semibold leading-none tracking-[-0.5px] text-[#191919]">
            N
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[16px] font-semibold leading-tight text-[#111b21]">
            Numa
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="8" fill="#25d366" />
              <path d="m4.6 8.2 2.2 2.2 4.6-4.6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <p className="text-[12px] leading-tight text-[#667781]">online</p>
        </div>
        <div className="flex items-center gap-4 text-[#007aff]">
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none" aria-hidden>
            <rect x="0.9" y="0.9" width="15" height="14.2" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M17.6 6.2 23 3v10l-5.4-3.2V6.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M6.2 2.6c.5-.5 1.3-.4 1.7.2l1.5 2.3c.3.5.2 1.2-.3 1.6l-1 .8a10 10 0 0 0 4.4 4.4l.8-1c.4-.5 1-.6 1.6-.3l2.3 1.5c.6.4.7 1.2.2 1.7l-1.2 1.2c-.6.6-1.5.8-2.3.5A16.2 16.2 0 0 1 4.5 6.1c-.3-.8-.1-1.7.5-2.3l1.2-1.2Z" />
          </svg>
        </div>
      </div>

      {/* wallpaper + messages */}
      <div
        className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 no-scrollbar"
        style={{ background: WA_BG }}
      >
        {/* doodle wallpaper, faint — same read as WhatsApp's without lifting the art */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 18%, #000 1.4px, transparent 1.6px), radial-gradient(circle at 62% 42%, #000 1.4px, transparent 1.6px), radial-gradient(circle at 33% 78%, #000 1.4px, transparent 1.6px), radial-gradient(circle at 85% 88%, #000 1.4px, transparent 1.6px)",
            backgroundSize: "90px 90px, 130px 130px, 110px 110px, 150px 150px",
          }}
        />
        <div className="relative space-y-2">
          <div className="flex justify-center pb-1">
            <span className="rounded-md bg-[#e2e0d8] px-2.5 py-1 text-[12px] font-medium text-[#5b6870] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
              Today
            </span>
          </div>
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="lumi-typing flex items-center gap-1 rounded-[10px] rounded-tl-[3px] bg-white px-4 py-3 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                <span /> <span /> <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-[#dcdcdc] bg-[#f6f6f6] px-3 pb-6 pt-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#007aff]" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div className="flex min-h-[36px] flex-1 items-center gap-2 rounded-[18px] border border-[#d1d1d6] bg-white px-3 py-1.5">
          <span className="min-h-[20px] flex-1 text-[16px] leading-[20px] text-[#111b21]">
            {draft}
            {draft && <span className="animate-pulse">|</span>}
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#007aff]" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.7" />
            <path d="M14 21v-4a3 3 0 0 1 3-3h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#007aff]" aria-hidden>
          <rect x="2.5" y="6.5" width="19" height="13" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="13" r="3.6" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8.5 6.5 10 4h4l1.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#007aff]" aria-hidden>
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M18 11a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.9V22h2v-3.1A8 8 0 0 0 20 11h-2Z" />
        </svg>
      </div>
    </div>
  );
}
