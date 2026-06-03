"use client";

import { useApp } from "@/lib/store";

export function StatusBar() {
  const screen = useApp((s) => s.screen);
  const onHero = screen === "explore" || screen === "tripDetail";

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 top-0 z-30 flex h-12 items-end justify-between px-7 pb-1 ${
        onHero ? "text-white" : "text-ink"
      }`}
    >
      <span className="text-[15px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.5}
              y={8 - i * 2.5}
              width="3"
              height={4 + i * 2.5}
              rx="1"
              fill="currentColor"
            />
          ))}
        </svg>
        {/* wifi */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
          <path d="M8.5 11.2 6.3 8.5a3.4 3.4 0 0 1 4.4 0L8.5 11.2Z" />
          <path
            d="M3.8 5.6a7.2 7.2 0 0 1 9.4 0l-1.5 1.8a4.9 4.9 0 0 0-6.4 0L3.8 5.6Z"
            opacity="0.95"
          />
          <path
            d="M1.4 2.9a10.8 10.8 0 0 1 14.2 0l-1.5 1.8a8.5 8.5 0 0 0-11.2 0L1.4 2.9Z"
            opacity="0.95"
          />
        </svg>
        {/* battery */}
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
          <rect x="24" y="4" width="1.6" height="5" rx="0.8" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
