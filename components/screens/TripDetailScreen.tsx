"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useStay } from "@/lib/demo/stay";
import { ListItem, ListDivider } from "./ListItem";

// ---------------------------------------------------------------------------
// Figma: "Trip Details" — 7256:13081 (Lumi Vision). Every asset below is the
// exported Figma glyph or photo; the red ones are masked so they take the
// city colour rather than the export's baked-in Berlin red.
// ---------------------------------------------------------------------------
const IMG_HERO_ROOM = "/trip/hero-room.jpg";
const IMG_HERO_GUESTS = "/trip/hero-guests.jpg";
const IMG_BANNER_EXTRAS = "/trip/banner-extras.jpg";
const IMG_BANNER_BENEFITS = "/trip/banner-benefits.jpg";

const ICON_BACK = "/trip/back-arrow.svg";
const ICON_CHEVRON_RED = "/trip/chevron-red.svg";
const ICON_DOOR = "/trip/icon-door-back.svg";
const ICON_DIALPAD = "/trip/icon-dialpad.svg";
const ICON_HOTEL = "/trip/icon-hotel.svg";
const ICON_LIST = "/trip/icon-list.svg";

// City accent (Figma variable city/<name>). Berlin is the frame's own colour.
const CITY_COLOR: Record<string, string> = {
  Berlin: "#ea2720",
  Amsterdam: "#d31779",
};

// The card is a ticket: a 33px strip with an 8px semicircular bite taken out of
// each edge, 17px down. Masking the strip (rather than drawing notches) keeps
// the bites perfectly round at any card width, and the parent's drop-shadow
// filter then wraps the notches too — exactly as the Figma "Subtract" does.
const NOTCH_MASK = {
  maskImage:
    "radial-gradient(circle 8px at 0 17px, transparent 8px, #000 8px), radial-gradient(circle 8px at 100% 17px, transparent 8px, #000 8px)",
  WebkitMaskImage:
    "radial-gradient(circle 8px at 0 17px, transparent 8px, #000 8px), radial-gradient(circle 8px at 100% 17px, transparent 8px, #000 8px)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
} as const;

// Elevation/1 on the booking card, Elevation/2 on the promo banners.
const CARD_SHADOW =
  "drop-shadow(0px 4px 3px rgba(0,0,0,0.06)) drop-shadow(0px 4px 13.5px rgba(0,0,0,0.07))";
const BANNER_SHADOW = "0px 10px 20px rgba(0,0,0,0.06)";

const TIPS_CHIPS = ["Arrival", "Staying", "Departing"] as const;
type TipsChip = (typeof TIPS_CHIPS)[number];

const HELPFUL_TIPS = [
  { icon: "/trip/icon-dry-cleaning.svg", label: "Getting fresh towels" },
  { icon: "/trip/icon-ac.svg", label: "How to use the air conditioner" },
  { icon: "/trip/icon-thermostat.svg", label: "How to use the heating" },
  { icon: "/trip/icon-iron.svg", label: "Ironing station" },
  { icon: "/trip/icon-add-home.svg", label: "How to extend your stay" },
];

// A red Figma glyph recoloured to the running city's accent.
function CityGlyph({ src, size, color }: { src: string; size: number; color: string }) {
  return (
    <span
      aria-hidden
      className="block shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TripDetailScreen() {
  const go = useApp((s) => s.go);
  const stay = useStay();
  const [activeChip, setActiveChip] = useState<TipsChip>("Staying");

  const city = CITY_COLOR[stay.city] ?? CITY_COLOR.Berlin;

  return (
    <div className="pb-32">

      {/* ── Hero — 570px of brand pink; everything in it is placed from the
          hero's own edges so it tracks the frame on a narrower screen ────── */}
      <div className="relative h-[570px] overflow-hidden bg-[#ffc9d2]">

        {/* Switch trip bar — y=50 (under the status bar), h=56, px-20 py-16 */}
        <div className="absolute left-0 right-0 top-[50px] flex h-[56px] items-center px-5">
          <button
            onClick={() => go("trips")}
            className="flex items-center active:opacity-60"
            aria-label="Back to trips"
          >
            <CityGlyph src={ICON_BACK} size={20} color={city} />
          </button>
          {/* Figma's notification bell sits here at 0% opacity — omitted. */}
        </div>

        {/* Title + address — the block's baseline sits 335px off the hero bottom */}
        <div className="absolute bottom-[335px] left-0 right-0 flex flex-col gap-1 px-6">
          <h1
            className="text-[36px] font-semibold leading-[44px] tracking-[-0.4px]"
            style={{ color: city }}
          >
            {stay.property}
          </h1>
          <button className="flex items-center gap-2 active:opacity-70">
            <span
              className="whitespace-nowrap text-[16px] font-semibold leading-6 tracking-[-0.2px]"
              style={{ color: city }}
            >
              {stay.location}
            </span>
            <CityGlyph src={ICON_CHEVRON_RED} size={24} color={city} />
          </button>
        </div>

        {/* Room still — 192×191, overhanging the left edge by 27px */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG_HERO_ROOM}
          alt=""
          className="absolute bottom-[104px] left-[-27px] h-[191px] w-[192px] object-cover"
        />
        {/* Guest still — 143×174, overhanging the right edge by 27px, mirrored.
            Figma crops the fill off-centre (182.49% wide, offset -16.47%), so
            the frame keeps the couple rather than the centre of the photo. */}
        <div className="absolute bottom-[80px] right-[-27px] h-[174px] w-[143px] scale-x-[-1] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMG_HERO_GUESTS}
            alt=""
            className="absolute left-[-16.47%] top-0 h-full w-[182.49%] max-w-none"
          />
        </div>
      </div>

      {/* ── Main content — starts 146px above the hero's bottom, which lands
          the card's own top edge at y=432 (Figma: hero 570, card top 432) ── */}
      <div className="relative z-10 -mt-[146px]">

        {/* Booking card — a ticket, notched at the fold */}
        <div className="px-6 py-2">
          <div style={{ filter: CARD_SHADOW }}>
            {/* Dates — px-24, pt 24+8, pb 16 */}
            <div className="flex items-start justify-between rounded-t-[24px] bg-white px-6 pb-4 pt-8">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[16px] font-semibold leading-6 tracking-[-0.2px] text-[#191919]">
                  Check-in
                </p>
                <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
                  {stay.checkInDate}
                </p>
                <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
                  {stay.checkInTime}
                </p>
              </div>

              {/* 59px hairline, outline/default/light */}
              <div className="h-[59px] w-px shrink-0 bg-[#eceae7]" />

              <div className="flex min-w-0 flex-1 flex-col items-end text-right">
                <p className="whitespace-nowrap text-[16px] font-semibold leading-6 tracking-[-0.2px] text-[#191919]">
                  Check-out
                </p>
                <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
                  {stay.checkOutDate}
                </p>
                <p className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
                  {stay.checkOutTime}
                </p>
              </div>
            </div>

            {/* The fold — notched sides, dashed rule inset 8px and 17px down */}
            <div className="relative h-[33px] bg-white" style={NOTCH_MASK}>
              <div
                className="absolute left-2 right-2 top-[17px] h-px"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, #eceae7 0 6px, transparent 6px 9px)",
                }}
              />
            </div>

            {/* Room + code — px-24, pt 16, pb 8+24 */}
            <div className="flex items-center justify-between rounded-b-[24px] bg-white px-6 pb-8 pt-4">
              <span className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ICON_DOOR} alt="" className="block size-[24px]" />
                <span className="whitespace-pre text-[16px] font-semibold leading-6 tracking-[-0.2px] text-[#191919]">
                  {`Room:  ${stay.room}`}
                </span>
              </span>
              <span className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ICON_DIALPAD} alt="" className="block size-[24px]" />
                <span className="whitespace-pre text-right text-[14px] font-semibold leading-5 tracking-[-0.2px] text-[#191919]">
                  {`Code:  ${stay.doorCode} ✓`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Content — pt-32, gap-24 ─────────────────────────────────────── */}
        <div className="flex flex-col gap-6 pt-8">

          {/* Essential list */}
          <div className="flex flex-col gap-2 px-6">
            <ListItem
              icon={ICON_HOTEL}
              title="Your room"
              subtitle="Photos, amenities, and more"
              onClick={() => go("yourRoom")}
            />
            <ListDivider />
            <ListItem
              icon={ICON_LIST}
              title="Manage your booking"
              subtitle="View invoice, cancel or edit"
            />
          </div>

          {/* Promo banners — 96px rows, gap-8 */}
          <div className="flex flex-col gap-2">
            {[
              {
                title: "Get trip extras",
                sub: "Breakfast, late check out, free gym access and more",
                img: IMG_BANNER_EXTRAS,
              },
              {
                title: "Enjoy member benefits",
                sub: "Late check-out, early check-in, snack - all for free",
                img: IMG_BANNER_BENEFITS,
              },
            ].map((b) => (
              <div key={b.title} className="flex h-24 items-center px-6">
                <button
                  className="flex flex-1 items-center gap-4 rounded-[12px] border border-[#eceae7] bg-white py-3 pl-6 pr-3 text-left active:bg-[#f4f4f4]"
                  style={{ boxShadow: BANNER_SHADOW }}
                >
                  <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span className="text-[16px] font-semibold leading-5 tracking-[-0.2px] text-black">
                      {b.title}
                    </span>
                    <span className="text-[14px] font-light leading-[1.3] tracking-[-0.2px] text-[#6d706f]">
                      {b.sub}
                    </span>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.img}
                    alt=""
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Helpful tips — gap-16 */}
          <div className="flex flex-col gap-4 bg-white">
            <div className="flex items-center justify-between py-2 pl-6 pr-3">
              <h2 className="whitespace-nowrap text-[28px] font-semibold leading-[1.1] tracking-[-0.4px] text-[#191919]">
                Helpful tips
              </h2>
              <button className="flex items-center gap-0.5 text-[16px] font-semibold leading-5 tracking-[-0.2px] text-[#191919] active:opacity-60">
                View all
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

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

            {/* List items — rows 40px tall, 7px either side of each divider */}
            <div className="flex flex-col gap-[7px] px-6">
              {HELPFUL_TIPS.map(({ icon, label }, i) => (
                <div key={label} className="contents">
                  <ListItem icon={icon} title={label} />
                  {i < HELPFUL_TIPS.length - 1 && <ListDivider />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
