"use client";

import { useApp } from "@/lib/store";

// ── Icons ──────────────────────────────────────────────────────────────────────
function IconTv() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M8 20h8M12 7V3M9 3l3 4 3-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconThermometer() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />
      <line x1="11.5" y1="7" x2="12.5" y2="7" strokeLinecap="round" />
      <line x1="11.5" y1="10" x2="12.5" y2="10" strokeLinecap="round" />
    </svg>
  );
}

function IconLamp() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2v3" strokeLinecap="round" />
      <path d="M8 5h8l-2 7H10L8 5Z" />
      <line x1="12" y1="12" x2="12" y2="22" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" strokeLinecap="round" />
    </svg>
  );
}

function IconBlinds() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="round" />
      <line x1="3" y1="13" x2="21" y2="13" strokeLinecap="round" />
      <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
      <line x1="14" y1="18" x2="14" y2="21" strokeLinecap="round" />
    </svg>
  );
}

function IconSpeaker() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="7" y="3" width="10" height="18" rx="3" />
      <circle cx="12" cy="17" r="2" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconSpotlight() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3v2" strokeLinecap="round" />
      <path d="M9 5h6l3 7H6l3-7Z" />
      <line x1="6" y1="12" x2="4" y2="20" strokeLinecap="round" />
      <line x1="18" y1="12" x2="20" y2="20" strokeLinecap="round" />
      <line x1="6" y1="20" x2="18" y2="20" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── RoomControlsScreen ─────────────────────────────────────────────────────────
export function RoomControlsScreen() {
  const go = useApp((s) => s.go);
  const smartRoom = useApp((s) => s.smartRoom);
  const { tv, ac, lights, blinds } = smartRoom;

  const blindsLabel =
    blinds.position === 100 ? "Open" :
    blinds.position === 0   ? "Closed" :
    `${blinds.position}% open`;

  const acLabel =
    ac.mode === "off" ? "Off" : `${ac.setpoint}°c`;

  const tiles = [
    {
      icon: <IconTv />,
      label: "Smart TV",
      status: tv.on ? (tv.app ?? "On") : "Off",
      active: tv.on,
      onTap: () => go("tvRemote"),
    },
    {
      icon: <IconThermometer />,
      label: "Temperature",
      status: acLabel,
      active: ac.mode !== "off",
    },
    {
      icon: <IconLamp />,
      label: "Lighting",
      status: lights.on ? `${lights.brightness}%` : "Off",
      active: lights.on,
    },
    {
      icon: <IconBlinds />,
      label: "Blinds",
      status: blindsLabel,
      active: blinds.position > 0,
    },
    {
      icon: <IconSpeaker />,
      label: "Nest mini",
      status: "Off",
      active: false,
    },
    {
      icon: <IconSpotlight />,
      label: "Spotlight",
      status: "Off",
      active: false,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-white">
      {/* Header with pink gradient */}
      <div
        className="relative shrink-0 px-5 pt-14 pb-8"
        style={{
          background: "linear-gradient(160deg, #fff5f7 0%, #ffffff 60%)",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => go("tripDetail")}
          className="absolute left-4 top-[52px] flex h-9 w-9 items-center justify-center rounded-full text-[#191919]/60 active:bg-black/5"
          aria-label="Back"
        >
          <IconChevronLeft />
        </button>

        <div className="mt-4">
          <h1 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.5px] text-[#191919]">
            Your smart room
          </h1>
          <p className="mt-2 text-[16px] font-light leading-6 text-[#6d706f]">
            Adjust lights, temperature, and more.
          </p>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-10">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            onClick={tile.onTap}
            className="flex flex-col gap-8 rounded-[18px] bg-[#f0f0f0] p-5 text-left active:opacity-75"
            style={{ minHeight: "140px" }}
          >
            <span className={tile.active ? "text-[#191919]" : "text-[#191919]/70"}>
              {tile.icon}
            </span>
            <div>
              <p className="text-[17px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                {tile.label}
              </p>
              <p className="mt-0.5 text-[15px] font-light leading-5 text-[#6d706f]">
                {tile.status}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
