"use client";

// Your room — a literal port of Figma 7256-4436. Photos, the facts, and what's
// in it. The last stop on the walk before she taps Ask Lumi and realises she
// can just ask for the lights.

import { useApp } from "@/lib/store";
import { useStay } from "@/lib/demo/stay";
import { ListItem } from "./ListItem";

const IMG_HERO = "/room/hero.jpg";
const ICON_BACK = "/room/chevron-back.svg";
const IMG_DOTS = "/room/dots.svg";

// Figma: linear-gradient(to bottom, transparent 52.477%, rgba(0,0,0,0.44) 70.588%)
const HERO_SCRIM =
  "linear-gradient(180deg, rgba(0,0,0,0) 52.477%, rgba(0,0,0,0.44) 70.588%)";

const ROOM_FACTS = [
  { icon: "/room/icon-person.svg", label: "2 adults" },
  { icon: "/room/icon-height.svg", label: "21 square meters" },
  { icon: "/room/icon-bed.svg", label: "1 queen bed" },
  { icon: "/room/icon-shower.svg", label: "Private bathroom" },
];

const AMENITIES = [
  { icon: "/room/icon-kitchen.svg", label: "Kitchenette" },
  { icon: "/room/icon-coffee-maker.svg", label: "Coffee machine and kettle" },
  { icon: "/room/icon-coffee.svg", label: "Free tea and coffee" },
  { icon: "/room/icon-tv.svg", label: "Smart TV" },
  { icon: "/room/icon-microwave.svg", label: "Microwave" },
  { icon: "/room/icon-air.svg", label: "Hair dryer" },
];

// Numa/Header/mobile/H2 — 28 / 1.1 / -0.4, semibold.
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="whitespace-nowrap text-[28px] font-semibold leading-[1.1] tracking-[-0.4px] text-black">
      {children}
    </p>
  );
}

// Tertiary button, Small — underlined label, p-3 clamped to the DS's 40px.
function ViewAll() {
  return (
    <button className="flex h-10 items-center justify-center gap-2 rounded-lg p-3 active:opacity-60">
      <span className="whitespace-nowrap text-[16px] font-semibold leading-[1.3] tracking-[-0.2px] text-[#191919] underline decoration-solid">
        View all
      </span>
    </button>
  );
}

// Icon + label, gap-4, rows 4px apart, no chevron and no divider — the DS row
// with its Right Addon switched off.
function FactList({ items }: { items: { icon: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1 px-6">
      {items.map(({ icon, label }) => (
        <ListItem key={label} icon={icon} title={label} chevron={false} />
      ))}
    </div>
  );
}

export function YourRoomScreen() {
  const go = useApp((s) => s.go);
  const stay = useStay();

  return (
    <div className="pb-32">

      {/* ── Hero — 323px of room photo, scrimmed at the bottom ──────────── */}
      <div className="relative h-[323px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG_HERO} alt="" className="h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: HERO_SCRIM }}
        />

        {/* Toolbar — y=50, h=56; the back button is a 40px dimmed circle, with
            the carousel dots opposite it on the same centre line. Figma parks
            the dots down by the title, but there they crowd the second line at
            our narrower screen width. */}
        <div className="absolute inset-x-0 top-[50px] flex h-[56px] items-center justify-between px-5">
          <button
            onClick={() => go("tripDetail")}
            aria-label="Back to trip"
            className="flex size-10 items-center justify-center rounded-full bg-[#f4f4f4] active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_BACK} alt="" className="block size-[24px]" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG_DOTS} alt="" className="block h-[8px] w-[50px] shrink-0" />
        </div>

        {/* Title — the hero's foot, now with the full column to wrap in */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.5px] text-[#ffc9d2]">
            {stay.roomType}
          </h1>
        </div>
      </div>

      {/* ── Content — blocks 24px apart, 16px below the hero ────────────── */}
      <div className="flex flex-col gap-6 pt-4">

        {/* Your room */}
        <div className="flex flex-col">
          <div className="flex h-14 items-center justify-between pl-6 pr-3">
            <SectionTitle>Your room</SectionTitle>
          </div>
          <FactList items={ROOM_FACTS} />
        </div>

        {/* Room amenities */}
        <div className="flex flex-col">
          <div className="flex items-center py-2 pl-6 pr-3">
            <SectionTitle>Room amenities</SectionTitle>
          </div>
          <FactList items={AMENITIES} />
          <div className="flex flex-col items-start px-4">
            <ViewAll />
          </div>
        </div>

        {/* Please note */}
        <div className="flex flex-col">
          <div className="flex h-10 items-center justify-between pl-6 pr-3">
            <p className="whitespace-nowrap text-[18px] font-semibold leading-[1.3] tracking-[-0.2px] text-black">
              Please note
            </p>
          </div>
          <div className="px-6">
            <p className="text-[16px] font-light leading-5 tracking-[-0.2px] text-[#6d706f]">
              The charm and character of our European buildings make variations
              within each category inevitable. Although all apartments in this
              category are similar in size and amenities, they may differ
              slightly in layout. Therefore, the room or apartment you see in
              the pictures might be slightly different from the one you get
              allocated.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
