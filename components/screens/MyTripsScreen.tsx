"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { UPCOMING_TRIP } from "@/lib/mock/guest";

const TABS = ["Current", "Past", "Cancelled"] as const;

export function MyTripsScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Current");
  const openTrip = useApp((s) => s.openTrip);

  return (
    <div className="px-6 pb-28 pt-14">
      {/* Title — Numa/Header/mobile/H1: 36px, 600, leading 1.1, tracking -0.5, black */}
      <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.5px] text-black">
        Trips
      </h1>

      {/* Filter chips — h-9 (36px), gap-2 (8px). Match Explore screen pattern:
          active = bg-#191919 text-white; inactive = 2px border #eceae7, dark text. */}
      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[16px] font-semibold leading-5 tracking-[-0.2px] ${
              tab === t
                ? "bg-[#191919] text-white"
                : "border-2 border-[#eceae7] text-[#191919]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Current" ? (
        // Trip card — width fills, border outline/default/default (#dedddb), p-3 (12px),
        // gap-4 (16px) image↔content, radius-l (16px), bg white.
        <button
          onClick={() => openTrip("amsterdam")}
          className="mt-4 flex w-full gap-4 rounded-2xl border border-[#dedddb] bg-white p-3 text-left active:bg-[#f4f4f4]"
        >
          {/* Image: 88×88, radius-m (8px), object-cover */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={UPCOMING_TRIP.image}
            alt=""
            className="h-[88px] w-[88px] shrink-0 rounded-lg object-cover"
          />

          {/* Content column — gap-2 (8px) */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 self-stretch">
            {/* Badge: Attentive/warning — bg #fff0e9, text #b24612 */}
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fff0e9] px-2.5 py-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b24612" strokeWidth="2.2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <span className="text-[12px] font-semibold leading-4 tracking-[-0.2px] text-[#b24612]">
                Check-in required
              </span>
            </span>

            {/* Core info — Body/Small/Regular (14px, 300, leading-5, tracking -0.2) */}
            <div className="flex flex-col text-[14px] font-light leading-5 tracking-[-0.2px]">
              <span className="text-[#191919]">{UPCOMING_TRIP.property}</span>
              <span className="text-[#6d706f]">{UPCOMING_TRIP.dates}</span>
              <span className="text-[#6d706f]">ID {UPCOMING_TRIP.reservationId}</span>
            </div>
          </div>
        </button>
      ) : (
        <div className="mt-10 text-center text-[14px] text-ink-faint">
          No {tab.toLowerCase()} trips.
        </div>
      )}

      {/* Add missing reservation — Tertiary button, Small size, leading "+" icon,
          underlined text, centered (not full-width, no border, no background). */}
      <div className="mt-8 flex justify-center">
        <button className="flex items-center gap-1 active:opacity-70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] font-semibold leading-[1.3] tracking-[-0.2px] underline decoration-solid text-black">
            Add missing reservation
          </span>
        </button>
      </div>
    </div>
  );
}
