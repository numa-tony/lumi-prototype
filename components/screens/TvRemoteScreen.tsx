"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PixelBeams } from "@/components/effects/PixelBeams";

const PINK = "#ffc9d2";
const BLACK = "#191919";

// ── Icon helpers ───────────────────────────────────────────────────────────────
function IconChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPower() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2v6" strokeLinecap="round" />
      <path d="M6.3 5.3A8 8 0 1 0 17.7 5.3" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconMinus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconVolume() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="1.8" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
    </svg>
  );
}
function IconTv() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="1.8" aria-hidden>
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M8 20h8" strokeLinecap="round" />
    </svg>
  );
}
function IconChevronUp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" aria-hidden>
      <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2.2" aria-hidden>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" aria-hidden>
      <path d="M9 14 4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9h10.5A4.5 4.5 0 0 1 19 13.5v0A4.5 4.5 0 0 1 14.5 18H13" strokeLinecap="round" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={PINK} stroke="none" aria-hidden>
      <path d="M6 4.5 19.5 12 6 19.5V4.5Z" />
    </svg>
  );
}
function IconMute() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="1.8" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m17 9 4 4m0-4-4 4" strokeLinecap="round" />
    </svg>
  );
}

// ── Control button ─────────────────────────────────────────────────────────────
function CtrlBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center active:opacity-60"
      style={{ color: PINK }}
    >
      {children}
    </button>
  );
}

// ── TvRemoteScreen ─────────────────────────────────────────────────────────────
export function TvRemoteScreen() {
  const go = useApp((s) => s.go);
  const setSmartRoom = useApp((s) => s.setSmartRoom);
  const tvOn = useApp((s) => s.smartRoom.tv.on);
  const tvShader = useApp((s) => s.tvShader);
  const [tab, setTab] = useState<"remote" | "channels">("remote");

  const tv = useApp((s) => s.smartRoom.tv);
  const togglePower = () => setSmartRoom({ tv: { ...tv, on: !tvOn }, lastDevice: "tv" });

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ background: tvShader.bgColor }}>
      {/* Pixel beams shader background */}
      <PixelBeams className="pointer-events-none absolute inset-0 h-full w-full" params={tvShader} />

      {/* ── Content (above shader) ── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between px-5 pt-14 pb-2">
        <button
          onClick={() => go("roomControls")}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-black/10"
          style={{ color: BLACK }}
          aria-label="Back"
        >
          <IconChevronLeft />
        </button>
        <button
          onClick={togglePower}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-black/10"
          style={{ color: tvOn ? BLACK : "#191919AA" }}
          aria-label="Power"
        >
          <IconPower />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex shrink-0 border-b border-black/10">
        {(["remote", "channels"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-1 items-center justify-center py-3 text-[18px] font-semibold tracking-[-0.2px]"
            style={{
              color: BLACK,
              borderBottom: tab === t ? `2px solid ${BLACK}` : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t === "remote" ? "Remote" : "Channels"}
          </button>
        ))}
      </div>

      {/* ── Remote tab ── */}
      {tab === "remote" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-10">

          {/* D-pad ring */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 240, height: 240 }}
          >
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full active:opacity-80"
              style={{ background: BLACK }}
            />
            {/* Inner hole */}
            <div
              className="relative rounded-full z-10"
              style={{ width: 88, height: 88, background: PINK }}
            />
            {/* Direction indicators */}
            {[
              { top: 10, left: "50%", transform: "translateX(-50%)" },
              { bottom: 10, left: "50%", transform: "translateX(-50%)" },
              { left: 10, top: "50%", transform: "translateY(-50%)" },
              { right: 10, top: "50%", transform: "translateY(-50%)" },
            ].map((style, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{ width: 6, height: 6, background: PINK, opacity: 0.4, ...style }}
              />
            ))}
          </div>

          {/* Two pill columns */}
          <div className="flex items-center justify-center gap-8">
            {/* Volume pill */}
            <div
              className="flex flex-col items-center justify-between py-5 px-6 gap-4"
              style={{
                background: BLACK,
                borderRadius: 999,
                width: 86,
                height: 210,
              }}
            >
              <CtrlBtn><IconPlus /></CtrlBtn>
              <CtrlBtn><IconVolume /></CtrlBtn>
              <CtrlBtn><IconMinus /></CtrlBtn>
            </div>

            {/* Channel/input pill */}
            <div
              className="flex flex-col items-center justify-between py-5 px-6 gap-4"
              style={{
                background: BLACK,
                borderRadius: 999,
                width: 86,
                height: 210,
              }}
            >
              <CtrlBtn><IconChevronUp /></CtrlBtn>
              <CtrlBtn><IconTv /></CtrlBtn>
              <CtrlBtn><IconChevronDown /></CtrlBtn>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-center gap-6">
            {[<IconBack key="b" />, <IconPlay key="p" />, <IconMute key="m" />].map((icon, i) => (
              <button
                key={i}
                className="flex items-center justify-center rounded-full active:opacity-60"
                style={{ background: BLACK, width: 60, height: 60 }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Channels tab ── */}
      {tab === "channels" && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[16px] font-light" style={{ color: `${BLACK}80` }}>
            Channel guide coming soon
          </p>
        </div>
      )}

      </div>{/* end z-10 content wrapper */}
    </div>
  );
}
