"use client";

// The iOS home screen — the moment the status stops needing us at all. A
// stylised springboard (our own tiles, not Apple's icon art) so the eye goes
// where it should: the Dynamic Island at the top.

import { useApp } from "@/lib/store";
import { useRequestProgress } from "@/lib/demo/request";
import { DynamicIsland } from "./RequestActivity";

interface AppTile {
  label: string;
  bg: string;
  glyph: React.ReactNode;
}

const g = (d: string, stroke = "#fff") => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d={d} stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ROW_1: AppTile[] = [
  { label: "Mail", bg: "linear-gradient(180deg,#54b3fb,#1f7ff5)", glyph: g("M3 7h18v10H3zM3 7l9 6 9-6") },
  { label: "Clock", bg: "#1c1c1e", glyph: g("M12 7v5l3 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z") },
  { label: "Notes", bg: "linear-gradient(180deg,#ffe27a,#f7c948)", glyph: g("M7 8h10M7 12h10M7 16h6", "#8a6a12") },
  { label: "Maps", bg: "linear-gradient(180deg,#7fe08a,#3aa657)", glyph: g("M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3ZM9 7v13M15 4v13") },
];

const ROW_2: AppTile[] = [
  { label: "TV", bg: "#1c1c1e", glyph: g("M3 6h18v11H3zM8 21h8") },
  { label: "News", bg: "linear-gradient(180deg,#ff7a7a,#ee3d3d)", glyph: g("M5 5h14v14H5zM8 9h8M8 13h8M8 17h4") },
  { label: "App Store", bg: "linear-gradient(180deg,#4fa8ff,#0a6cf1)", glyph: g("m12 6 5 9H7l5-9ZM7.5 19h9") },
  { label: "Photos", bg: "linear-gradient(140deg,#ffd36e,#ff7ac0,#7ab6ff)", glyph: g("M5 17l4-5 3 3 3-4 4 6H5Z") },
];

const ROW_3: AppTile[] = [
  { label: "Health", bg: "#ffffff", glyph: g("M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z", "#ff375f") },
  { label: "Wallet", bg: "#1c1c1e", glyph: g("M4 8h16v10H4zM4 8l8-3 8 3") },
  { label: "Settings", bg: "linear-gradient(180deg,#b9b9bd,#7c7c81)", glyph: g("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4") },
  { label: "Music", bg: "linear-gradient(180deg,#ff6d7e,#f5203c)", glyph: g("M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z") },
];

function Tile({ tile }: { tile: AppTile }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-[58px] w-[58px] items-center justify-center rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
        style={{ background: tile.bg }}
      >
        {tile.glyph}
      </div>
      <span className="text-[11px] font-light text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {tile.label}
      </span>
    </div>
  );
}

function NumaTile() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
        <span className="text-[26px] font-bold leading-none tracking-tight text-[#191919]">N</span>
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff3b30] text-[11px] font-semibold text-white ring-2 ring-white/20">
          1
        </span>
      </div>
      <span className="text-[11px] font-light text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        Numa
      </span>
    </div>
  );
}

export function HomeSurface() {
  const request = useApp((s) => s.demo.request);
  const expanded = useApp((s) => s.demo.islandExpanded);
  const progress = useRequestProgress(request);

  return (
    <div className="absolute inset-0 z-[45] overflow-hidden">
      {/* wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 22% 2%, #e6ded4 0%, #c3b8ac 34%, #8d8378 66%, #4f4a45 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 78% 68%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%), radial-gradient(50% 40% at 15% 85%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <DynamicIsland request={request} progress={progress} expanded={expanded} />

      {/* status bar */}
      <div className="relative flex h-12 items-end justify-between px-7 pb-1 text-white">
        <span className="text-[15px] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 4.5} y={8 - i * 2.5} width="3" height={4 + i * 2.5} rx="1" fill="currentColor" />
            ))}
          </svg>
          <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* app grid */}
      <div className="relative flex flex-col gap-5 px-6 pt-10">
        {[ROW_1, ROW_2, ROW_3].map((row, i) => (
          <div key={i} className="flex justify-between">
            {row.map((t) => (
              <Tile key={t.label} tile={t} />
            ))}
          </div>
        ))}
        <div className="flex justify-between">
          <NumaTile />
          <span className="w-[58px]" />
          <span className="w-[58px]" />
          <span className="w-[58px]" />
        </div>
      </div>

      {/* search pill + dock */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-6">
        <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[13px] font-light text-white backdrop-blur">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
            <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Search
        </span>
        <div className="mx-4 flex w-[calc(100%-32px)] justify-between rounded-[28px] bg-white/20 px-4 py-3 backdrop-blur-xl">
          {[
            { label: "Phone", bg: "linear-gradient(180deg,#78e07f,#33b53d)", d: "M6.2 2.6c.5-.5 1.3-.4 1.7.2l1.5 2.3c.3.5.2 1.2-.3 1.6l-1 .8a10 10 0 0 0 4.4 4.4l.8-1c.4-.5 1-.6 1.6-.3l2.3 1.5c.6.4.7 1.2.2 1.7l-1.2 1.2c-.6.6-1.5.8-2.3.5A16.2 16.2 0 0 1 4.5 6.1c-.3-.8-.1-1.7.5-2.3l1.2-1.2Z" },
            { label: "Safari", bg: "linear-gradient(180deg,#5fc6ff,#0a84ff)", d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2 5-5 2 2-5 5-2Z" },
            { label: "Messages", bg: "linear-gradient(180deg,#78e07f,#33b53d)", d: "M12 4c4.4 0 8 2.9 8 6.5S16.4 17 12 17c-.9 0-1.7-.1-2.5-.3L5 18l1.2-2.8A6.6 6.6 0 0 1 4 10.5C4 6.9 7.6 4 12 4Z" },
            { label: "Music", bg: "linear-gradient(180deg,#ff6d7e,#f5203c)", d: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" },
          ].map((a) => (
            <div
              key={a.label}
              className="flex h-[58px] w-[58px] items-center justify-center rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
              style={{ background: a.bg }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d={a.d} stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
        <span className="h-[5px] w-[135px] rounded-full bg-white/80" />
      </div>
    </div>
  );
}
