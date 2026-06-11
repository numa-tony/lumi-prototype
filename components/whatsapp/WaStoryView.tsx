"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { WaBubble } from "./WaBubble";

// Presentational WA conversation for story mode. Reads from demo.storyWa
// instead of live useChat, so the runner can inject scripted messages imperatively.
export function WaStoryView() {
  const messages = useApp((s) => s.demo.storyWa.messages);
  const draft = useApp((s) => s.demo.storyWa.draft);
  const lumiTyping = useApp((s) => s.demo.storyWa.lumiTyping);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lumiTyping]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Message scroll area */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] py-3 no-scrollbar">
        {messages.length === 0 && !draft && !lumiTyping && (
          <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
            <div className="text-4xl">💬</div>
            <p className="px-8 text-[13px] text-[#8a8a8a]">
              Sarah&apos;s WhatsApp conversation with Lumi
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <WaBubble key={msg.id} message={msg} />
        ))}

        {/* Lumi typing dots */}
        {lumiTyping && (
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

      {/* Read-only composer showing the typewriter draft */}
      <div className="shrink-0 flex items-center gap-2 bg-[#f0f0f0] px-3 py-2">
        {/* emoji button */}
        <button className="shrink-0 text-[#8a8a8a]" aria-label="Emoji" tabIndex={-1}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
            <circle cx="9" cy="10" r="0.5" fill="currentColor" />
            <circle cx="15" cy="10" r="0.5" fill="currentColor" />
          </svg>
        </button>

        <div className="flex flex-1 items-center rounded-full bg-white px-4 py-2 shadow-sm min-h-[38px]">
          {draft ? (
            <span className="flex-1 text-[14px] text-[#111]">
              {draft}
              <span className="inline-block w-px h-[14px] bg-[#111] align-middle ml-px animate-pulse" />
            </span>
          ) : (
            <span className="flex-1 text-[14px] text-[#aaa]">Message</span>
          )}
        </div>

        {/* send/mic button */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
