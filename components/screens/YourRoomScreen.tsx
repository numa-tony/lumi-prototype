"use client";

// Your room — photos, the facts, and what's in it. The last stop on the walk
// before she taps Ask Lumi and realises she can just ask for the lights.

import { useApp } from "@/lib/store";
import { useStay } from "@/lib/demo/stay";

const IMG_ROOM = "/allhands/room-hero.png";

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4 py-2.5">
      <span className="shrink-0 text-[#191919]">{icon}</span>
      <span className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#191919]">
        {label}
      </span>
    </div>
  );
}

const stroke = { stroke: "#191919", strokeWidth: 1.6, fill: "none" } as const;

const IconPerson = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" strokeLinecap="round" />
  </svg>
);
const IconSize = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <path d="M12 3v18M12 3 8.5 6.5M12 3l3.5 3.5M12 21l-3.5-3.5M12 21l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconBed = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <path d="M3 18v-7h18v7M3 18v2M21 18v2M3 11V7M3 11h18M7 11V9h5v2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconShower = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <path d="M6 10a6 6 0 0 1 12 0H6ZM12 4v4M9 14v1M12 15v1M15 14v1M9 18v1M12 19v1M15 18v1" strokeLinecap="round" />
  </svg>
);
const IconKitchen = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M4 10h16M8 6.5h.01M8 14h.01" strokeLinecap="round" />
  </svg>
);
const IconCoffee = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8ZM16 10h2a2 2 0 0 1 0 4h-2M4 21h13" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconTea = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <path d="M6 10h10v5a5 5 0 0 1-10 0v-5ZM9 6.5c0-1 1-1.5 1-2.5M13 6.5c0-1 1-1.5 1-2.5M4 21h15" strokeLinecap="round" />
  </svg>
);
const IconMicrowave = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <rect x="5" y="8.5" width="10" height="7" rx="1" />
    <path d="M18 9.5v.01M18 12v.01M18 14.5v.01" strokeLinecap="round" />
  </svg>
);
const IconDesk = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden>
    <path d="M3 9h18M4 9v11M20 9v11M4 5h16v4H4zM8 13h5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function YourRoomScreen() {
  const go = useApp((s) => s.go);
  const stay = useStay();

  return (
    <div className="pb-32">
      {/* Hero */}
      <div className="relative h-[323px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG_ROOM} alt="" className="h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)" }}
        />

        <button
          onClick={() => go("tripDetail")}
          aria-label="Back to trip"
          className="absolute left-5 top-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2.2" aria-hidden>
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1 className="absolute bottom-9 left-6 right-16 text-[32px] font-semibold leading-[1.12] tracking-[-0.4px] text-[#ffc9d2]">
          {stay.roomType}
        </h1>

        <div className="absolute bottom-4 right-6 flex items-center gap-2">
          {[8, 8, 6, 4].map((d, i) => (
            <span
              key={i}
              className="rounded-full bg-white"
              style={{ height: d, width: d, opacity: i === 0 ? 1 : 0.55 }}
            />
          ))}
        </div>
      </div>

      {/* Your room */}
      <section className="px-6 pt-5">
        <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-[#191919]">
          Your room
        </h2>
        <div className="mt-2">
          <Row icon={IconPerson} label="2 adults" />
          <Row icon={IconSize} label="21 square meters" />
          <Row icon={IconBed} label="1 queen bed" />
          <Row icon={IconShower} label="Private bathroom" />
        </div>
      </section>

      {/* Room amenities */}
      <section className="px-6 pt-6">
        <h2 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-[#191919]">
          Room amenities
        </h2>
        <div className="mt-2">
          <Row icon={IconKitchen} label="Kitchenette" />
          <Row icon={IconCoffee} label="Coffee machine and kettle" />
          <Row icon={IconTea} label="Free tea and coffee" />
          <Row icon={IconMicrowave} label="Microwave" />
          <Row icon={IconDesk} label="Work desk" />
        </div>
      </section>

      {/* Please note */}
      <section className="px-6 pt-6">
        <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.2px] text-[#191919]">
          Please note
        </h2>
        <p className="mt-2 text-[15px] font-light leading-[22px] tracking-[-0.2px] text-[#6d706f]">
          The charm and character of our European buildings make variations within each category
          inevitable. Although all apartments in this category are similar in size and amenities,
          they may differ slightly in layout.
        </p>
      </section>
    </div>
  );
}
