"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { UPCOMING_TRIP } from "@/lib/mock/guest";

const IMG_ROOM_LEFT =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80&auto=format&fit=crop";
const IMG_ROOM_RIGHT =
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&q=80&auto=format&fit=crop";
const IMG_EXTRAS =
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80&auto=format&fit=crop";
const IMG_BENEFITS =
  "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=400&q=80&auto=format&fit=crop";

// Amsterdam brand color (Numa city palette)
const AMSTERDAM = "#d31779";

const TIPS_CHIPS = ["Arrival", "Staying", "Departing"] as const;
type TipsChip = (typeof TIPS_CHIPS)[number];

// ---------------------------------------------------------------------------
// Inline SVG icons — stroke style, 24px viewBox, matching DS conventions
// ---------------------------------------------------------------------------
function IconHotel() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
      <path d="M2 19V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10" strokeLinecap="round" />
      <line x1="2" y1="19" x2="22" y2="19" strokeLinecap="round" />
      <rect x="6.5" y="12" width="4" height="7" rx="1" />
      <rect x="13.5" y="12" width="4" height="4" rx="1" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
      <line x1="9" y1="6" x2="20" y2="6" strokeLinecap="round" />
      <line x1="9" y1="12" x2="20" y2="12" strokeLinecap="round" />
      <line x1="9" y1="18" x2="20" y2="18" strokeLinecap="round" />
      <circle cx="5" cy="6" r="1.5" fill="#191919" stroke="none" />
      <circle cx="5" cy="12" r="1.5" fill="#191919" stroke="none" />
      <circle cx="5" cy="18" r="1.5" fill="#191919" stroke="none" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLuggage() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
      <rect x="6" y="8" width="12" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 4 0v2" strokeLinecap="round" />
      <line x1="12" y1="11" x2="12" y2="17" strokeLinecap="round" />
      <line x1="9" y1="14" x2="15" y2="14" strokeLinecap="round" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
      <path d="M5 11.5 7 6h10l2 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="11.5" width="20" height="6" rx="2" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </svg>
  );
}

function IconDoor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
      <path d="M13 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h8Z" />
      <line x1="13" y1="3" x2="13" y2="21" />
      <circle cx="10" cy="12" r="1.2" fill="#191919" stroke="none" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b2b2b2" strokeWidth="1.5" aria-hidden>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HELPFUL_TIPS = [
  { Icon: IconClock,   label: "Your check-in time" },
  { Icon: IconLuggage, label: "Storing your luggage" },
  { Icon: IconCar,     label: "Paid parking info" },
  { Icon: IconDoor,    label: "Finding your room" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TripDetailScreen() {
  const go = useApp((s) => s.go);
  const [activeChip, setActiveChip] = useState<TipsChip>("Arrival");

  return (
    <div className="pb-32">

      {/* ── Hero — pink bg, property name, decorative room photos ─────── */}
      <div className="relative h-[464px] overflow-hidden" style={{ background: "#ffc9d2" }}>
        {/* Back arrow */}
        <button
          onClick={() => go("trips")}
          className="absolute left-5 top-14 flex h-8 w-8 items-center justify-center active:opacity-60"
          aria-label="Back to trips"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={AMSTERDAM} strokeWidth="2.5" aria-hidden>
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Property title + address */}
        <div className="absolute left-0 right-0 top-[96px] px-6">
          <h1
            className="text-[36px] font-semibold leading-[1.1] tracking-[-0.4px]"
            style={{ color: AMSTERDAM }}
          >
            {UPCOMING_TRIP.property}
          </h1>
          <button className="mt-2 flex items-center gap-1.5 active:opacity-70">
            <span
              className="text-[16px] font-semibold leading-6 tracking-[-0.2px]"
              style={{ color: AMSTERDAM }}
            >
              Ridderspoorweg 175, Amsterdam
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AMSTERDAM} strokeWidth="2" aria-hidden>
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Decorative room photos — positioned in lower hero zone */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG_ROOM_LEFT}
          alt=""
          className="absolute bottom-[52px] left-[-20px] h-[172px] w-[176px] object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG_ROOM_RIGHT}
          alt=""
          className="absolute bottom-[40px] right-0 h-[160px] w-[132px] object-cover"
        />
      </div>

      {/* ── Booking card — overlaps hero, rounded top corners ─────────── */}
      <div className="relative -mt-8 z-10">
        <div
          className="mx-6 overflow-hidden rounded-[24px] bg-white"
          style={{ boxShadow: "0px 4px 3px rgba(0,0,0,0.06), 0px 4px 13.5px rgba(0,0,0,0.07)" }}
        >
          {/* Dates row */}
          <div className="flex items-start justify-between px-6 pb-4 pt-6">
            {/* Check-in */}
            <div>
              <p className="text-[16px] font-semibold leading-6 tracking-[-0.2px] text-[#191919]">
                Check-in
              </p>
              <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">Mon, Apr 14</p>
              <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">2:00 PM CET</p>
            </div>

            {/* Vertical dashed divider */}
            <div className="flex items-center self-stretch py-1">
              <div className="h-full border-l border-dashed border-[#dedddb]" />
            </div>

            {/* Check-out */}
            <div className="text-right">
              <p className="text-[16px] font-semibold leading-6 tracking-[-0.2px] text-[#191919]">
                Check-out
              </p>
              <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">Tue, Apr 15</p>
              <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">11:00 AM CET</p>
            </div>
          </div>

          {/* Ticket perforated divider */}
          <div className="mx-6 border-t border-dashed border-[#dedddb]" />

          {/* CTA section */}
          <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
            <button className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[#191919] text-[16px] font-semibold tracking-[-0.2px] text-white active:bg-[#333]">
              Check-in now
            </button>
            <p className="text-center text-[14px] font-light leading-5 tracking-[-0.2px] text-[#6d706f]">
              Online check-in required before stay.
            </p>
          </div>
        </div>

        {/* ── Content below card ──────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-8">

          {/* Essential list — Your room + Manage your booking */}
          <div className="flex flex-col px-6">
            <button className="flex w-full items-center gap-4 py-2 text-left active:opacity-70">
              <div className="shrink-0">
                <IconHotel />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
                <p className="text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                  Your room
                </p>
                <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
                  Photos, amenities, and more
                </p>
              </div>
              <div className="shrink-0">
                <IconChevronRight />
              </div>
            </button>

            <div className="border-t border-[#eceae7]" />

            <button className="flex w-full items-center gap-4 py-2 text-left active:opacity-70">
              <div className="shrink-0">
                <IconList />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
                <p className="text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                  Manage your booking
                </p>
                <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
                  View invoice, cancel or edit
                </p>
              </div>
              <div className="shrink-0">
                <IconChevronRight />
              </div>
            </button>
          </div>

          {/* Promo banners */}
          <div className="flex flex-col gap-2 px-6">
            {/* Get trip extras */}
            <button
              className="flex h-24 w-full items-center gap-4 rounded-[12px] border border-[#eceae7] bg-white pl-6 pr-3 py-3 text-left active:bg-[#f4f4f4]"
              style={{ boxShadow: "0px 10px 20px rgba(0,0,0,0.06)" }}
            >
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                  Get trip extras
                </p>
                <p className="text-[14px] font-light leading-[1.3] tracking-[-0.2px] text-[#6d706f]">
                  Breakfast, late check out, free gym access and more
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_EXTRAS}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            </button>

            {/* Enjoy member benefits */}
            <button
              className="flex h-24 w-full items-center gap-4 rounded-[12px] border border-[#eceae7] bg-white pl-6 pr-3 py-3 text-left active:bg-[#f4f4f4]"
              style={{ boxShadow: "0px 10px 20px rgba(0,0,0,0.06)" }}
            >
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                  Enjoy member benefits
                </p>
                <p className="text-[14px] font-light leading-[1.3] tracking-[-0.2px] text-[#6d706f]">
                  Late check-out, early check-in, snack – all for free
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_BENEFITS}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            </button>
          </div>

          {/* Helpful tips */}
          <div className="flex flex-col gap-4">
            {/* Section header */}
            <div className="flex items-center justify-between pl-6 pr-3 py-2">
              <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.4px] text-[#191919]">
                Helpful tips
              </h2>
              <button className="flex items-center gap-0.5 text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919] active:opacity-60">
                View all
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Filter chips — same pattern as Explore / My Trips */}
            <div className="flex gap-2 px-6">
              {TIPS_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[16px] font-semibold leading-5 tracking-[-0.2px] ${
                    chip === activeChip
                      ? "bg-[#191919] text-white"
                      : "border-2 border-[#eceae7] text-[#191919]"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Tip list items */}
            <div className="flex flex-col px-6">
              {HELPFUL_TIPS.map(({ Icon, label }, i) => (
                <div key={label}>
                  <button className="flex w-full items-center gap-4 py-2 text-left active:opacity-70">
                    <div className="shrink-0">
                      <Icon />
                    </div>
                    <p className="flex-1 text-[16px] font-light leading-5 tracking-[-0.2px] text-[#191919]">
                      {label}
                    </p>
                    <div className="shrink-0">
                      <IconChevronRight />
                    </div>
                  </button>
                  {i < HELPFUL_TIPS.length - 1 && (
                    <div className="border-t border-[#eceae7]" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
