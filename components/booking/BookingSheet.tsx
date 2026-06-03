"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";

// ── City list ────────────────────────────────────────────────────────────────

const NUMA_CITIES = [
  "Amsterdam", "Antwerp", "Barcelona", "Berlin", "Bonn", "Bremen",
  "Brighton", "Brussels", "Cologne", "Copenhagen", "Dresden", "Düsseldorf",
  "Edinburgh", "Frankfurt", "Hamburg", "Lisbon", "London", "Madrid",
  "Mainz", "Milan", "Munich", "Paris", "Porto", "Rotterdam",
  "Seville", "Stuttgart", "Vienna", "Zurich",
];

function BuildingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M5 28V10.5L16 4l11 6.5V28H20v-8h-8v8H5Zm3-3h4v-5h-3v5Zm0-8h4v-4H8v4Zm0-7h4V7H8v3Zm6 7h4v-4h-4v4Zm0-7h4V7h-4v3Zm6 7h4v-4h-4v4Zm0-7h4V7h-4v3Z" />
    </svg>
  );
}

// ── Property data ─────────────────────────────────────────────────────────────

type Property = {
  id: string;
  name: string;
  tagline: string;
  location: string;
  stayTypes: string[];
  pricePerNight: number;
  image: string;
  dotCount: number;
};

const CITY_PROPERTIES: Record<string, Property[]> = {
  Amsterdam: [
    {
      id: "ams-1",
      name: "Numa Amsterdam Oosterpark",
      tagline: "Contemporary studio in a lively neighbourhood",
      location: "Oosterpark, Amsterdam East",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 129,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "ams-2",
      name: "YAYS Amsterdam North by Numa",
      tagline: "Design apartments with canal-side charm",
      location: "Amsterdam Noord",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 158,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&auto=format&fit=crop",
      dotCount: 4,
    },
    {
      id: "ams-3",
      name: "YAYS Amsterdam East by Numa",
      tagline: "Boutique living near Artis Zoo",
      location: "Zeeburg, Amsterdam East",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 142,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "ams-4",
      name: "Numa Amsterdam Jordaan",
      tagline: "Charming apartments in Amsterdam's finest quarter",
      location: "Jordaan, Amsterdam West",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 175,
      image: "https://images.unsplash.com/photo-1578683994832-a6e51de56406?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
  ],
  Barcelona: [
    {
      id: "bcn-1",
      name: "Numa Barcelona Gothic",
      tagline: "Steps from the Ramblas in the heart of the old city",
      location: "Barri Gòtic, Barcelona",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 139,
      image: "https://images.unsplash.com/photo-1520250497591-112791e38f8e?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "bcn-2",
      name: "Numa Barcelona Eixample",
      tagline: "Modernist-inspired design in the city's iconic grid",
      location: "L'Eixample, Barcelona",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 162,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&auto=format&fit=crop",
      dotCount: 4,
    },
    {
      id: "bcn-3",
      name: "Numa Barcelona Poblenou",
      tagline: "Creative district stay near the beach",
      location: "Poblenou, Barcelona",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 118,
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
  ],
  Berlin: [
    {
      id: "ber-1",
      name: "Numa Berlin Mitte",
      tagline: "Right in the pulse of the German capital",
      location: "Mitte, Berlin",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 115,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "ber-2",
      name: "Numa Berlin Novela",
      tagline: "Award-winning design near Rosenthaler Platz",
      location: "Prenzlauer Berg, Berlin",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 135,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80&auto=format&fit=crop",
      dotCount: 4,
    },
    {
      id: "ber-3",
      name: "Numa Berlin Charlottenburg",
      tagline: "Elegant stays near the Kurfürstendamm",
      location: "Charlottenburg, Berlin",
      stayTypes: ["1-Bed", "2-Bed"],
      pricePerNight: 155,
      image: "https://images.unsplash.com/photo-1578683994832-a6e51de56406?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
  ],
  London: [
    {
      id: "lon-1",
      name: "Numa London Shoreditch",
      tagline: "East London creativity at your doorstep",
      location: "Shoreditch, London E1",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 195,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "lon-2",
      name: "Numa London South Bank",
      tagline: "Cultural quarter on the Thames",
      location: "South Bank, London SE1",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 220,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&auto=format&fit=crop",
      dotCount: 4,
    },
  ],
  Paris: [
    {
      id: "par-1",
      name: "Numa Paris Marais",
      tagline: "Galleries, bakeries and Haussmann grandeur",
      location: "Le Marais, Paris 4e",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 175,
      image: "https://images.unsplash.com/photo-1520250497591-112791e38f8e?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "par-2",
      name: "Numa Paris Bastille",
      tagline: "Vibrant neighbourhood on the edge of Marais",
      location: "Bastille, Paris 11e",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 159,
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
  ],
  Munich: [
    {
      id: "muc-1",
      name: "Numa Munich Maxvorstadt",
      tagline: "Museums, galleries, and Bavarian charm",
      location: "Maxvorstadt, Munich",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 148,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "muc-2",
      name: "Numa Munich Schwabing",
      tagline: "The bohemian quarter, minutes from the English Garden",
      location: "Schwabing, Munich",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 165,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
  ],
  Vienna: [
    {
      id: "vie-1",
      name: "Numa Vienna Innere Stadt",
      tagline: "Imperial grandeur meets modern comfort",
      location: "Innere Stadt, Vienna 1",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 155,
      image: "https://images.unsplash.com/photo-1578683994832-a6e51de56406?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "vie-2",
      name: "Numa Vienna Naschmarkt",
      tagline: "The city's most vibrant market at your doorstep",
      location: "Mariahilf, Vienna 6",
      stayTypes: ["Studio", "1-Bed", "2-Bed"],
      pricePerNight: 142,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&auto=format&fit=crop",
      dotCount: 4,
    },
  ],
  Lisbon: [
    {
      id: "lis-1",
      name: "Numa Lisbon Príncipe Real",
      tagline: "Miradouros, fado and azulejo-lined streets",
      location: "Príncipe Real, Lisbon",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 122,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
    {
      id: "lis-2",
      name: "Numa Lisbon Mouraria",
      tagline: "Authentic neighbourhood with rooftop views",
      location: "Mouraria, Lisbon",
      stayTypes: ["Studio", "1-Bed"],
      pricePerNight: 108,
      image: "https://images.unsplash.com/photo-1520250497591-112791e38f8e?w=600&q=80&auto=format&fit=crop",
      dotCount: 3,
    },
  ],
};

const DEFAULT_PROPERTIES: Property[] = [
  {
    id: "gen-1",
    name: "Numa Apartments",
    tagline: "Design-led living in the city centre",
    location: "City Centre",
    stayTypes: ["Studio", "1-Bed"],
    pricePerNight: 140,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&auto=format&fit=crop",
    dotCount: 3,
  },
  {
    id: "gen-2",
    name: "Numa Suites",
    tagline: "Spacious apartments for longer stays",
    location: "City Centre",
    stayTypes: ["1-Bed", "2-Bed"],
    pricePerNight: 170,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80&auto=format&fit=crop",
    dotCount: 3,
  },
];

// ── Property card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, nights }: { property: Property; nights: number }) {
  const totalPrice = property.pricePerNight * nights;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dedddb] bg-white">
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={property.image} alt="" className="h-full w-full object-cover" />
        {/* Dot pagination */}
        {property.dotCount > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {Array.from({ length: property.dotCount }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        <p className="text-[17px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
          {property.name}
        </p>
        <p className="text-[14px] font-light leading-5 tracking-[-0.1px] text-[#6d706f]">
          {property.tagline}
        </p>

        {/* Location */}
        <div className="mt-0.5 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6d706f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-[13px] font-light tracking-[-0.1px] text-[#6d706f]">{property.location}</p>
        </div>

        {/* Stay types + price */}
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {property.stayTypes.map((t) => (
              <span key={t} className="rounded-full border border-[#dedddb] px-2.5 py-1 text-[12px] font-semibold text-[#191919]">
                {t}
              </span>
            ))}
          </div>
          <span className="shrink-0 rounded-full bg-[#ffc9d2] px-3 py-1 text-[13px] font-semibold text-[#191919]">
            €{property.pricePerNight} / night
          </span>
        </div>

        {nights > 1 && (
          <p className="text-[12px] font-light tracking-[-0.1px] text-[#6d706f]">
            €{totalPrice.toLocaleString()} total · {nights} night{nights !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Where step ────────────────────────────────────────────────────────────────

function WhereStep({ onSelect }: { onSelect: (city: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = NUMA_CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="flex shrink-0 items-center justify-center px-4 pb-5 pt-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-text">Where</h2>
      </div>

      <div className="shrink-0 px-5 pb-5">
        <div className="flex items-center gap-3 rounded-full border-2 border-[#191919] px-4 py-3.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, property..."
            className="flex-1 bg-transparent text-[16px] font-light leading-6 tracking-[-0.2px] text-text outline-none placeholder:text-text-secondary"
          />
          {query && (
            <button onClick={() => setQuery("")} className="shrink-0 text-text-secondary active:opacity-60" aria-label="Clear">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <p className="px-5 pb-2 pt-1 text-[13px] font-light tracking-[-0.1px] text-text-secondary">Numa Cities</p>
        {filtered.map((city) => (
          <button
            key={city}
            onClick={() => onSelect(city)}
            className="flex w-full items-center gap-4 px-5 py-3 text-left active:bg-surface-muted"
          >
            <span className="shrink-0 text-text"><BuildingIcon /></span>
            <span className="flex-1 text-[17px] font-light tracking-[-0.2px] text-text">{city}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-5 py-8 text-center text-[15px] font-light text-text-secondary">
            No cities match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </>
  );
}

// ── Calendar helpers ─────────────────────────────────────────────────────────

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getMonthCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dow = firstDay.getDay(); // 0=Sun
  const offset = dow === 0 ? 6 : dow - 1; // Monday-first
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function generateMonths(count = 6): { year: number; month: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── When step ─────────────────────────────────────────────────────────────────

function WhenStep({ city, onBack, onConfirm }: {
  city: string;
  onBack: () => void;
  onConfirm: (checkIn: Date, checkOut: Date) => void;
}) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const today = startOfDay(new Date());
  const months = generateMonths(6);

  const handleDay = (date: Date) => {
    if (date < today) return;
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
    } else if (date < checkIn) {
      setCheckIn(date);
      setCheckOut(null);
    } else if (date.getTime() === checkIn.getTime()) {
      setCheckIn(null);
    } else {
      setCheckOut(date);
    }
  };

  const nights = checkIn && checkOut
    ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
    : 0;

  return (
    <>
      {/* Header */}
      <div className="relative flex shrink-0 items-center justify-center px-4 pb-4 pt-3">
        <button onClick={onBack} className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full active:bg-surface-muted" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-text">When</h2>
      </div>

      {/* Day labels — sticky */}
      <div className="shrink-0 border-b border-line-light">
        <div className="grid grid-cols-7 px-3 pb-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[14px] font-semibold tracking-[-0.1px] text-text">
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable calendar */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4">
        {months.map(({ year, month }) => {
          const cells = getMonthCells(year, month);
          return (
            <div key={`${year}-${month}`} className="mb-6 mt-5">
              <p className="mb-4 text-[18px] font-semibold tracking-[-0.2px] text-text">
                {MONTH_NAMES[month]} {year}
              </p>
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((date, idx) => {
                  if (!date) return <div key={idx} />;
                  const ts = date.getTime();
                  const isPast = date < today;
                  const isCIn = checkIn && ts === checkIn.getTime();
                  const isCOut = checkOut && ts === checkOut.getTime();
                  const isInRange = checkIn && checkOut && date > checkIn && date < checkOut;
                  const isSelected = isCIn || isCOut;

                  const rangeLeft = isCIn && checkOut ? "bg-[#ffc9d2]/40 rounded-l-full" : "";
                  const rangeRight = isCOut ? "bg-[#ffc9d2]/40 rounded-r-full" : "";
                  const rangeFull = isInRange ? "bg-[#ffc9d2]/40" : "";

                  return (
                    <div key={idx} className={`relative flex items-center justify-center ${rangeLeft || rangeRight || rangeFull}`}>
                      <button
                        disabled={isPast}
                        onClick={() => handleDay(date)}
                        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-light tracking-[-0.2px] transition-colors
                          ${isPast ? "text-text-disabled cursor-default" : "active:bg-surface-muted"}
                          ${isSelected ? "bg-text text-white font-semibold" : "text-text"}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm bar */}
      <div className="shrink-0 border-t border-line-light bg-surface p-4">
        {checkIn && !checkOut && (
          <p className="mb-2 text-center text-[13px] font-light text-text-secondary">
            Select your checkout date
          </p>
        )}
        {checkIn && checkOut && (
          <p className="mb-2 text-center text-[13px] font-light text-text-secondary">
            {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night{nights !== 1 ? "s" : ""}
          </p>
        )}
        <button
          disabled={!checkIn || !checkOut}
          onClick={() => checkIn && checkOut && onConfirm(checkIn, checkOut)}
          className={`w-full rounded-2xl py-4 text-[17px] font-semibold tracking-[-0.2px] transition-colors
            ${checkIn && checkOut
              ? "bg-text text-white active:opacity-80"
              : "bg-surface-muted text-text-disabled cursor-default"
            }`}
        >
          Confirm
        </button>
      </div>
    </>
  );
}

// ── Guests step ───────────────────────────────────────────────────────────────

const GUEST_TYPES = [
  { key: "adults",   label: "Adults",   subtitle: "Age 13 and above", min: 1 },
  { key: "children", label: "Children", subtitle: "Age 2–12",          min: 0 },
  { key: "infants",  label: "Infants",  subtitle: "Under 2 years old", min: 0 },
] as const;

type GuestKey = (typeof GUEST_TYPES)[number]["key"];
export type GuestCounts = Record<GuestKey, number>;

function GuestsStep({ onBack, onConfirm }: {
  onBack: () => void;
  onConfirm: (counts: GuestCounts) => void;
}) {
  const [counts, setCounts] = useState<GuestCounts>({ adults: 1, children: 0, infants: 0 });

  const adjust = (key: GuestKey, delta: number) => {
    const type = GUEST_TYPES.find((t) => t.key === key)!;
    setCounts((prev) => ({ ...prev, [key]: Math.max(type.min, prev[key] + delta) }));
  };

  return (
    <>
      {/* Header */}
      <div className="relative flex shrink-0 items-center justify-center px-4 pb-4 pt-3">
        <button onClick={onBack} className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full active:bg-surface-muted" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-text">Guests</h2>
      </div>

      {/* Stepper rows */}
      <div className="flex-1 px-5 pt-2">
        {GUEST_TYPES.map((type, i) => {
          const count = counts[type.key];
          const atMin = count <= type.min;
          return (
            <div key={type.key}>
              {i > 0 && <div className="h-px bg-line-light" />}
              <div className="flex items-center gap-4 py-5">
                <div className="flex-1">
                  <p className="text-[17px] font-semibold tracking-[-0.2px] text-text">{type.label}</p>
                  <p className="mt-0.5 text-[14px] font-light tracking-[-0.1px] text-text-secondary">{type.subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => adjust(type.key, -1)}
                    disabled={atMin}
                    className={`flex h-[44px] w-[44px] items-center justify-center rounded-[12px] transition-colors
                      ${atMin ? "bg-surface-muted text-text-disabled cursor-default" : "bg-surface-muted text-text active:opacity-70"}`}
                    aria-label={`Decrease ${type.label}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="w-5 text-center text-[17px] font-light tracking-[-0.2px] text-text">{count}</span>
                  <button
                    onClick={() => adjust(type.key, 1)}
                    className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-text text-white active:opacity-80"
                    aria-label={`Increase ${type.label}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="shrink-0 border-t border-line-light bg-surface p-4">
        <button
          onClick={() => onConfirm(counts)}
          className="w-full rounded-2xl bg-text py-4 text-[17px] font-semibold tracking-[-0.2px] text-white active:opacity-80"
        >
          Search
        </button>
      </div>
    </>
  );
}

// ── Results step ──────────────────────────────────────────────────────────────

function ResultsStep({
  city,
  dates,
  guests,
  onBack,
  onClose,
}: {
  city: string;
  dates: { checkIn: Date; checkOut: Date };
  guests: GuestCounts;
  onBack: () => void;
  onClose: () => void;
}) {
  const properties = CITY_PROPERTIES[city] ?? DEFAULT_PROPERTIES;
  const nights = Math.round((dates.checkOut.getTime() - dates.checkIn.getTime()) / 86400000);
  const totalGuests = guests.adults + guests.children;
  const guestLabel = `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`;
  const dateLabel = `${formatDate(dates.checkIn)} – ${formatDate(dates.checkOut)}`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="relative flex shrink-0 items-center justify-center px-4 pb-3 pt-3">
        <button onClick={onBack} className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full active:bg-surface-muted" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-text">Results</h2>
        <button onClick={onClose} className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full active:bg-surface-muted" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search summary pill */}
      <div className="shrink-0 px-4 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-full border-2 border-[#191919] px-4 py-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2.2" strokeLinecap="round" className="shrink-0" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <span className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.2px] text-[#191919]">{city}</span>
          <span className="text-[#6d706f]">·</span>
          <span className="whitespace-nowrap text-[14px] font-light tracking-[-0.2px] text-[#191919]">{dateLabel}</span>
          <span className="text-[#6d706f]">·</span>
          <span className="whitespace-nowrap text-[14px] font-light tracking-[-0.2px] text-[#191919]">{guestLabel}</span>
        </div>
      </div>

      {/* Count + filter row */}
      <div className="shrink-0 flex items-center justify-between px-4 pb-4">
        <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-[#191919]">
          {properties.length} Available propert{properties.length !== 1 ? "ies" : "y"}
        </h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 rounded-full border border-[#dedddb] px-3 py-1.5 text-[13px] font-semibold text-[#191919] active:bg-surface-muted">
            + Filter
          </button>
          <button className="flex items-center gap-1 rounded-full border border-[#dedddb] px-3 py-1.5 text-[13px] font-semibold text-[#191919] active:bg-surface-muted">
            ↓ Sort: Price
          </button>
        </div>
      </div>

      {/* Scrollable property list — pb-24 keeps content clear of the floating pill */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24">
        <div className="flex flex-col gap-4">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} nights={nights} />
          ))}
        </div>
      </div>

      {/* Floating List / Map toggle */}
      <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center">
        <button className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#191919] px-5 py-3 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="0.5" fill="white" />
            <circle cx="3" cy="12" r="0.5" fill="white" />
            <circle cx="3" cy="18" r="0.5" fill="white" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-white">List</span>
          <span className="mx-0.5 text-white/30">|</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[-0.2px] text-white/50">Map</span>
        </button>
      </div>
    </div>
  );
}

// ── BookingSheet ──────────────────────────────────────────────────────────────

type BookingStep = "where" | "when" | "guests" | "results";

export function BookingSheet() {
  const closeBooking = useApp((s) => s.closeBooking);
  const [step, setStep] = useState<BookingStep>("where");
  const [city, setCity] = useState<string | null>(null);
  const [dates, setDates] = useState<{ checkIn: Date; checkOut: Date } | null>(null);
  const [guests, setGuests] = useState<GuestCounts | null>(null);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
    >
      {/* Grabber — hidden on results step since we have a full header */}
      {step !== "results" && (
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "where" && (
          <motion.div key="where" className="flex min-h-0 flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            <WhereStep onSelect={(c) => { setCity(c); setStep("when"); }} />
          </motion.div>
        )}
        {step === "when" && (
          <motion.div key="when" className="flex min-h-0 flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
          >
            <WhenStep
              city={city!}
              onBack={() => setStep("where")}
              onConfirm={(checkIn, checkOut) => { setDates({ checkIn, checkOut }); setStep("guests"); }}
            />
          </motion.div>
        )}
        {step === "guests" && (
          <motion.div key="guests" className="flex min-h-0 flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
          >
            <GuestsStep
              onBack={() => setStep("when")}
              onConfirm={(counts) => { setGuests(counts); setStep("results"); }}
            />
          </motion.div>
        )}
        {step === "results" && city && dates && guests && (
          <motion.div key="results" className="flex min-h-0 flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
          >
            <ResultsStep
              city={city}
              dates={dates}
              guests={guests}
              onBack={() => setStep("guests")}
              onClose={closeBooking}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
