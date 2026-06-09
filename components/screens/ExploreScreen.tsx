"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { UPCOMING_TRIP } from "@/lib/mock/guest";

// ---------------------------------------------------------------------------
// All images use stable Unsplash URLs (replaced Jun 8 2026 after Figma MCP
// asset URLs expired). NOTE: never use full-frame Figma exports as images —
// they bake in UI elements (status bar, search bar).
// ---------------------------------------------------------------------------
const IMG_HERO =
  "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80&auto=format&fit=crop";
const IMG_PROP_1 =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80&auto=format&fit=crop";
const IMG_PROP_2 =
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80&auto=format&fit=crop";
const IMG_PROP_3 =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80&auto=format&fit=crop";
const IMG_GUEST_VIDEO =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80&auto=format&fit=crop";
const IMG_USP_1 =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80&auto=format&fit=crop";
const IMG_USP_2 =
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80&auto=format&fit=crop";
const IMG_AVT: [string, string][] = [
  // [url, ring-color] — first avatar gets brand pink ring
  ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&auto=format&fit=crop&crop=face", "#ffc9d2"],
  ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&auto=format&fit=crop&crop=face", "#dedddb"],
  ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80&auto=format&fit=crop&crop=face", "#dedddb"],
  ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&q=80&auto=format&fit=crop&crop=face", "#dedddb"],
  ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&q=80&auto=format&fit=crop&crop=face", "#dedddb"],
  ["https://images.unsplash.com/photo-1488161628813-04466f872be2?w=80&q=80&auto=format&fit=crop&crop=face", "#dedddb"],
];

const LOCATION_CHIPS = ["Amsterdam", "Antwerp", "Barcelona", "Berlin"];

const PROPERTIES = [
  { name: "Numa Amsterdam Oosterpark", img: IMG_PROP_1 },
  { name: "YAYS Amsterdam North by Numa", img: IMG_PROP_2 },
  { name: "YAYS Amsterdam East by Numa", img: IMG_PROP_3 },
];

const USP_CARDS = [
  {
    img: IMG_USP_1,
    title: "Digital check-in",
    subtitle: "No lines, no key card and no hassle.",
  },
  {
    img: IMG_USP_2,
    title: "Central locations",
    subtitle: "Numa puts you right where the action is.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ExploreScreen() {
  const openTrip = useApp((s) => s.openTrip);
  const openBooking = useApp((s) => s.openBooking);
  const [activeChip, setActiveChip] = useState("Amsterdam");

  return (
    <div className="pb-24">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative h-[405px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG_HERO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>

      {/* ── Search bar — straddles hero/content boundary by 36px ───────────
          -mt-9 = -36px pulls it up to overlap the hero bottom.
          py-2 outer padding + py-4 inner = matches Figma's py-[8px] container. */}
      <div className="relative -mt-9 z-10 px-6 py-2">
        <button onClick={openBooking} className="flex w-full items-center gap-3 rounded-full border-2 border-[#191919] bg-white px-4 py-4 text-left active:bg-surface-muted">
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="#191919" strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <span className="whitespace-nowrap text-[18px] font-semibold leading-6 tracking-[-0.2px] text-[#212322]">
            Where do you want to go?
          </span>
        </button>
      </div>

      {/* ── Scrollable content – gap-6 (spacing/xl 24px) between sections ── */}
      <div className="flex flex-col gap-6">

        {/* ── Upcoming trips ──────────────────────────────────────────────── */}
        <section className="flex flex-col gap-1">
          {/* Section title: Headline/Small — 24px, 600, leading-8 (32px), tracking-[-0.2px] */}
          <div className="px-6 py-2">
            <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-black">
              Upcoming trips
            </h2>
          </div>

          <div className="px-6">
            {/* Trip card: border outline/base/default, radius-l (16px), p-3 (spacing/s), gap-4 (spacing/m) */}
            <button
              onClick={() => openTrip("amsterdam")}
              className="flex w-full gap-4 rounded-2xl border border-[#dedddb] bg-white p-3 text-left active:bg-[#f4f4f4]"
            >
              {/* Image: 88×88, radius-m (8px) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={UPCOMING_TRIP.image}
                alt=""
                className="h-[88px] w-[88px] shrink-0 rounded-lg object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* Badge: bg-bg-warning (#fff0e9), text-text-warning (#b24612) */}
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fff0e9] px-2.5 py-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b24612" strokeWidth="2.2" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <span className="text-[12px] font-semibold leading-4 tracking-[-0.2px] text-[#b24612]">
                    Check-in required
                  </span>
                </span>

                {/* Core info: Body/Small/Regular — 14px, 300 (light), leading-5 (20px), tracking-[-0.2px] */}
                <div className="flex flex-col text-[14px] font-light leading-5 tracking-[-0.2px]">
                  <span className="text-[#191919]">{UPCOMING_TRIP.property}</span>
                  <span className="text-[#6d706f]">{UPCOMING_TRIP.dates}</span>
                  <span className="text-[#6d706f]">ID {UPCOMING_TRIP.reservationId}</span>
                </div>

                {/* Check-in now: 14px, 600, underline */}
                <div className="flex items-center gap-1 pb-2 pt-1">
                  <span className="text-[14px] font-semibold leading-[1.3] tracking-[-0.2px] underline decoration-solid text-black">
                    Check-in now
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" aria-hidden>
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ── Locations ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">

          {/* Header + chips wrapper: gap-2 (8px) */}
          <div className="flex flex-col gap-2">
            {/* Title row: Headline/Small, justify-between, px-6 py-2 */}
            <div className="flex items-center justify-between px-6 py-2">
              <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-[#191919]">
                Locations
              </h2>
              {/* Tertiary "View all" — Label/Medium/Bold with trailing arrow */}
              <button className="flex items-center gap-0.5 text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919] active:opacity-60">
                View all
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Chips: h-9 (36px), rounded-full, Label/Medium/Bold (16px, 600)
                Active: bg-[#191919] text-white. Inactive: border-2 border-[#eceae7] text-[#191919]
                px-3 per Figma: chip px-[6px] + inner text container px-[6px] = 12px each side */}
            <div className="-mr-6 flex gap-2 overflow-x-auto pl-6 no-scrollbar pr-6">
              {LOCATION_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveChip(c)}
                  className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[16px] font-semibold leading-5 tracking-[-0.2px] ${
                    c === activeChip
                      ? "bg-[#191919] text-white"
                      : "border-2 border-[#eceae7] text-[#191919]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Property cards: horizontal scroll, pl-6, each 161px wide, gap-4
              Image: h-158px, rounded-lg (8px)
              Caption: Body/Small/Regular (14px, 300, leading-5, tracking-[-0.2px]) */}
          <div className="flex gap-4 overflow-x-auto pl-6 no-scrollbar">
            {PROPERTIES.map((p, i) => (
              <div key={i} className="flex w-[161px] shrink-0 flex-col gap-[5px]">
                <div className="h-[158px] overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="text-[14px] font-light leading-5 tracking-[-0.2px] text-[#191919]">
                  {p.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Guest stories ────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="px-6 py-2">
            <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-[#191919]">
              Guest stories
            </h2>
          </div>

          {/* Avatar row: 64×64px circles, 2px ring.
              Wrapper handles overflow-x; inner div uses w-max to force single row. */}
          <div className="overflow-x-auto pl-6 no-scrollbar">
            <div className="flex w-max gap-2">
              {IMG_AVT.map(([src, ring], i) => (
                <div
                  key={i}
                  className="shrink-0 rounded-full p-[2px]"
                  style={{ background: ring, width: 64, height: 64 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-[60px] w-[60px] rounded-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Video frame: mx-6, h-[373px], radius-l (16px) */}
          <div className="relative mx-6 h-[373px] overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_GUEST_VIDEO} alt="" className="h-full w-full object-cover" />
            {/* Expand icon: top-right, 32×32, no bg */}
            <button
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center"
              aria-label="Expand"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* Mute icon: bottom-right, 32×32, bg brand-black, rounded-full */}
            <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#191919]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
                <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            </div>
          </div>
        </section>

        {/* ── More than a comfy bed (USP) ──────────────────────────────────── */}
        <section className="flex flex-col gap-2 pb-2">
          <div className="px-6 py-2">
            <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-black">
              More than a comfy bed
            </h2>
          </div>

          {/* USP cards: horizontal scroll, pl-6, 216px wide, gap-4
              Card: border-[#dedddb] 1px, radius-l (16px), p-4, gap-4
              Icon image: 50×50, radius-m (8px)
              Title: Label/Medium/Bold (16px, 600, leading-5, tracking-[-0.2px])
              Subtitle: Label/Small/Regular (14px, 300, leading-4 (16px), tracking-[-0.2px]) */}
          <div className="flex gap-4 overflow-x-auto pl-6 no-scrollbar pb-1">
            {USP_CARDS.map((u, i) => (
              <div
                key={i}
                className="flex w-[216px] shrink-0 flex-col gap-4 rounded-2xl border border-[#dedddb] bg-white p-4"
              >
                <div className="h-[50px] w-[50px] overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.img} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                    {u.title}
                  </p>
                  <p className="text-[14px] font-light leading-4 tracking-[-0.2px] text-[#6d706f]">
                    {u.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
