"use client";

import { useApp, CHAT_CONTEXTS } from "@/lib/store";

const IMG_LUMI_ORB = "https://www.figma.com/api/mcp/asset/f6a78c87-538f-46da-97aa-4b86ebbb85db";
const IMG_DOOR = "https://www.figma.com/api/mcp/asset/75b7454b-141d-4e30-a0bb-8eb2859eceb4";

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={IMG_DOOR} alt="" className="h-8 w-8 shrink-0 object-cover" />
                Doors
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
