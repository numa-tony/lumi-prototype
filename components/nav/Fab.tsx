"use client";

import { useApp, CHAT_CONTEXTS } from "@/lib/store";

const IMG_LUMI_ORB = "/lumi-torus.png";

export function Fab() {
  const screen = useApp((s) => s.screen);
  const openChat = useApp((s) => s.openChat);
  const inStay = useApp((s) => s.inStay);

  const ctx = screen === "explore" ? CHAT_CONTEXTS.explore : CHAT_CONTEXTS.stay;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[88px] z-30 flex justify-center">
      <div
        className="pointer-events-auto fab-border"
        style={{
          boxShadow: "0px 16px 32px 0px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="relative flex items-center overflow-hidden"
          style={{
            borderRadius: "16px",
            backdropFilter: "blur(7px)",
            WebkitBackdropFilter: "blur(7px)",
            background: "rgba(255,255,255,0.85)",
          }}
        >
          <div className="fab-dots" />
          {/* Ask AI */}
          <button
            onClick={() => openChat(ctx)}
            className="flex h-[56px] shrink-0 items-center gap-1 px-6 text-[16px] font-semibold tracking-[-0.2px] text-[#191919]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_LUMI_ORB} alt="" className="h-9 w-9 shrink-0 object-cover" />
            Ask AI
          </button>

          {/* Doors — only shown in stay mode */}
          {inStay && (
            <>
              <span className="h-[56px] w-px shrink-0 bg-[#eee]" />
              <button className="flex h-[56px] shrink-0 items-center gap-1 px-6 text-[16px] font-semibold tracking-[-0.2px] text-[#191919]">
                <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="4" width="20" height="26" rx="2" stroke="#191919" strokeWidth="2"/>
                  <circle cx="21" cy="17" r="1.5" fill="#191919"/>
                </svg>
                Doors
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
