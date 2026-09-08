"use client";

// The iOS lock screen. Her phone is face-up on the table and the countdown is
// still there — she never has to come back to us to know what's happening.

import { useApp } from "@/lib/store";
import { useRequestProgress } from "@/lib/demo/request";
import { LockActivity } from "./RequestActivity";

export function LockSurface() {
  const request = useApp((s) => s.demo.request);
  const progress = useRequestProgress(request);

  return (
    <div className="absolute inset-0 z-[45] overflow-hidden">
      {/* wallpaper — pink/coral into teal, the Figma lock screen's palette */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(155deg, #ffd9cf 0%, #ffb9a8 22%, #f2c46a 38%, #7fb9b2 58%, #1f7f96 78%, #0d3f5c 100%)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 55% at 88% 34%, rgba(90,110,120,0.55) 0%, rgba(90,110,120,0) 62%), radial-gradient(70% 50% at 8% 72%, rgba(255,240,235,0.55) 0%, rgba(255,240,235,0) 60%)",
        }}
      />

      {/* notch */}
      <div className="pointer-events-none absolute left-1/2 top-[11px] z-50 h-[36px] w-[124px] -translate-x-1/2 rounded-full bg-black" />

      {/* status bar */}
      <div className="relative flex h-12 items-end justify-between px-7 pb-1 text-white">
        <span className="text-[15px] font-semibold tracking-tight" />
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
          </svg>
        </div>
      </div>

      {/* date + clock */}
      <div className="relative mt-4 flex flex-col items-center text-white">
        <p className="text-[17px] font-semibold tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
          Friday, 10 July
        </p>
        <p
          className="text-[86px] font-semibold leading-none tracking-[-2px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          style={{ marginTop: 2 }}
        >
          9:41
        </p>
      </div>

      {/* Live Activity + shortcuts */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
        {request && progress && <LockActivity request={request} progress={progress} />}
        <div className="mt-5 flex items-center justify-between px-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/25 backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M10 3h4v4l-1 2v9a1 1 0 0 1-2 0V9l-1-2V3Z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/25 backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2.5" y="6.5" width="19" height="13" rx="3" stroke="#fff" strokeWidth="1.7" />
              <circle cx="12" cy="13" r="3.6" stroke="#fff" strokeWidth="1.7" />
            </svg>
          </span>
        </div>
        <div className="mt-5 flex justify-center">
          <span className="h-[5px] w-[135px] rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
