"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import type { GuestCounts } from "./BookingSheet";

const IMG_LUMI_ORB = "/lumi-torus.png";

// ── Mock data ─────────────────────────────────────────────────────────────────

const ROOMS = [
  { id: "r1", name: "Medium Studio with Kitchenette", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&auto=format&fit=crop", guests: "Max 2", size: "23 m²", bed: "Queen bed", price: 69 },
  { id: "r2", name: "Medium Studio — Accessible", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80&auto=format&fit=crop", guests: "Max 2", size: "27 m²", bed: "Queen bed", price: 69 },
  { id: "r3", name: "Extra Large Studio with Sofa Bed", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&auto=format&fit=crop", guests: "Max 4", size: "32 m²", bed: "King bed · Sofa bed", price: 76 },
  { id: "r4", name: "Extra Large Studio — Accessible", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&auto=format&fit=crop", guests: "Max 4", size: "37 m²", bed: "King bed · Sofa bed", price: 137 },
];

const AMENITIES = [
  { name: "Air conditioning",    path: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" },
  { name: "Accessible",         path: "M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm1 6H9l-1 5 3 1v6h2v-6l3-1-1-5z" },
  { name: "Pets allowed",       path: "M10 5.172C10 3.37 8.836 2 7.5 2 6.164 2 5 3.37 5 5.172c0 1.8 1.164 3.26 2.5 3.26S10 6.97 10 5.17zM16.5 5.172C16.5 3.37 15.336 2 14 2s-2.5 1.37-2.5 3.172c0 1.8 1.164 3.26 2.5 3.26s2.5-1.46 2.5-3.26zM19 12c0-2.21-1.79-4-4-4H9C6.79 8 5 9.79 5 12c0 1.86 1.28 3.41 3 3.86V20h8v-4.14c1.72-.45 3-2 3-3.86z" },
  { name: "Luggage storage",    path: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM9 2v20M9 12h6" },
  { name: "Lift",               path: "M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm7 2l4 4H8l4-4zm0 12l-4-4h8l-4 4z" },
  { name: "Coworking space",    path: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM12 17v4M8 21h8" },
  { name: "Baby bed",           path: "M2 4h20M2 4v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4M6 8v8M18 8v8M4 16h16a2 2 0 0 1 2 2v2H2v-2a2 2 0 0 1 2-2z" },
  { name: "Yoga mats",          path: "M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM5 22l1.5-7h11L19 22M9 11l-1 5M15 11l1 5" },
  { name: "Breakfast box",      path: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" },
  { name: "Shared laundry",     path: "M4 4h16v16H4V4zM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM16 8h.01" },
  { name: "Essentials closet",  path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zM9 22V12h6v10" },
  { name: "Highchair",          path: "M9 3h6M12 3v5M5 8h14M7 8l1 13h8l1-13M10 14h4" },
];

const SPOTLIGHT_FEATURES = [
  {
    name: "Rooftop pool",
    image: "https://images.unsplash.com/photo-1569860357904-6f19a7cd60e4?w=600&q=80&auto=format&fit=crop",
    description: "Take a quiet break above the city and cool off whenever you need a reset, with a rooftop pool that gives you space to unwind at your own pace.",
  },
  {
    name: "Fitness center",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&auto=format&fit=crop",
    description: "A fully-equipped gym with premium machines, free weights and a panoramic city view to keep you energised throughout your stay.",
  },
  {
    name: "Co-working lounge",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&auto=format&fit=crop",
    description: "Productive hours made easy — a bright co-working lounge with fast Wi-Fi, meeting pods and barista-quality coffee.",
  },
];

const NEIGHBORHOOD_IMGS = [
  "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=80&auto=format&fit=crop",
];

const POIS = [
  { id: "p1", name: "Markthal", walkTime: "5 min walk", rating: "4.4", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80&auto=format&fit=crop" },
  { id: "p2", name: "Kunsthal Museum", walkTime: "7 min walk", rating: "4.2", image: "https://images.unsplash.com/photo-1526281216101-e55f00f0db7a?w=200&q=80&auto=format&fit=crop" },
  { id: "p3", name: "Erasmus Bridge", walkTime: "11 min walk", rating: "4.7", image: "https://images.unsplash.com/photo-1512850183-6d7990f42385?w=200&q=80&auto=format&fit=crop" },
  { id: "p4", name: "Cube Houses", walkTime: "6 min walk", rating: "4.5", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&q=80&auto=format&fit=crop" },
  { id: "p5", name: "Cultural Quarter", walkTime: "4 min walk", rating: "4.3", image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=200&q=80&auto=format&fit=crop" },
];

const SOCIAL_IMGS = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=300&q=80&auto=format&fit=crop",
];

const REVIEWS = [
  { name: "Natalie", source: "Airbnb", date: "Mar 05, 2026", text: "Great stay overall. The apartment was spotless, the bed was very comfortable, and the digital check-in was super easy. Location was perfect for exploring the city." },
  { name: "Laura", source: "Google", date: "Feb 02, 2026", text: "Really impressed with how smooth everything was. Clear instructions before arrival, fast support when we had a question, and the room had everything we needed." },
  { name: "Marcus", source: "Booking.com", date: "Jan 11, 2026", text: "Stylish, modern place and very quiet at night. The self check-in worked flawlessly and the Wi-Fi was fast enough for remote work. Would definitely stay again." },
  { name: "Elena", source: "Airbnb", date: "Jan 02, 2026", text: "Perfect for a short city trip. Clean, well designed and very comfortable. We especially liked the kitchen setup and proximity to public transport." },
  { name: "Thomas", source: "Booking.com", date: "Dec 18, 2025", text: "Everything was exactly as described. The apartment felt brand new, towels and linens were fresh, and the neighborhood had great restaurants within walking distance." },
];

const FAQ_GROUPS = [
  {
    title: "Good to know",
    items: [
      { title: "Contact details", body: "Reach us anytime via the Numa app or email hello@numastays.com." },
      { title: "Pet policy", body: "Small pets are welcome at no extra charge. Please let us know in advance." },
      { title: "Smoking policy", body: "Smoking is not permitted inside the apartment. Designated areas are available outside." },
      { title: "Party policy", body: "To respect other guests, parties and loud gatherings are not allowed on the premises." },
    ],
  },
  {
    title: "FAQ",
    items: [
      { title: "What benefits do I get as a Numa member?", body: "Members enjoy early access to deals, flexible check-in times, and exclusive loyalty discounts." },
      { title: "Why do I need to check in before my arrival?", body: "Pre-check-in lets us prepare your apartment and send your access code before you arrive." },
      { title: "How can I contact the online reception?", body: "Use the in-app chat for instant support, available around the clock." },
      { title: "What is Numa's cleaning policy?", body: "All apartments are professionally cleaned before each stay with hospital-grade products." },
      { title: "How does the check-out work?", body: "Simply leave the keys inside and close the door. No front desk visit needed." },
    ],
  },
];

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection({ propertyName, city, heroImage, onBack }: {
  propertyName: string; city: string; heroImage: string; onBack: () => void;
}) {
  return (
    <div>
    <div className="relative h-[56vh] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroImage} alt="" className="h-full w-full object-cover" />
      {/* Dark fade at bottom so pink text reads on dark */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.65) 100%)" }}
      />
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute left-3 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 active:opacity-70"
        aria-label="Back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2.2" strokeLinecap="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      {/* Photo counter */}
      <div className="absolute right-3 top-4 rounded-full bg-black/50 px-3 py-1 text-[12px] font-semibold text-white">
        1/12
      </div>
      {/* Bottom text overlay — badge + name only */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <span className="mb-2.5 inline-block rounded-full bg-[#ffc9d2] px-4 py-1.5 text-[13px] font-semibold text-[#7a3a25]">
          New property
        </span>
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.5px] text-[#ffc9d2]">
          {propertyName}
        </h1>
      </div>
    </div>

    {/* Rating + address below image */}
    <div className="bg-white px-4 pt-3 pb-4">
      <div className="flex items-center gap-2">
        <svg width="15" height="14" viewBox="0 0 20 19" fill="#ffc9d2" aria-hidden>
          <path d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" />
        </svg>
        <span className="text-[14px] font-semibold text-[#191919]">4.63</span>
        <span className="text-[14px] font-light text-[#6d706f]">1033 reviews</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <svg width="10" height="13" viewBox="0 0 16 20" fill="#ffc9d2" aria-hidden>
          <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-10C3.58 0 0 3.58 0 8c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="text-[13px] font-light text-[#6d706f]">{city}</span>
      </div>
    </div>
    </div>
  );
}

// ── Intro (collage + pull quote + quick info) ─────────────────────────────────

function IntroSection({ propertyName, city }: { propertyName: string; city: string }) {
  return (
    <div className="bg-white">
      {/* Pull quote */}
      <div className="px-4 pt-6 pb-5">
        <p className="text-[18px] font-light leading-[1.5] tracking-[-0.2px] text-[#191919]">
          Where the city&apos;s energy meets genuine comfort — {propertyName} puts you right in the heart of {city}, with everything you need for a stay that feels effortless from the moment you arrive.
        </p>
      </div>

      {/* Quick info */}
      <div className="px-4 pb-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.8px] text-[#6d706f]">Quick info</p>
        {[
          { text: "4 min walk from central bus stop", d: "M17 12H7M7 12l3-3M7 12l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" },
          { text: "12 min walk from city museum",      d: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
          { text: "8 min walk from central park",      d: "M22 13H20V7H22V5H2V7H4V13H2V15H11V22H13V15H22V13ZM6 13V7H18V13H6Z" },
        ].map((row, i) => (
          <div key={i}>
            {i > 0 && <div className="h-px bg-[#eceae7]" />}
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d={row.d} />
                </svg>
              </div>
              <span className="text-[14px] font-light text-[#191919]">{row.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

function RoomsSection({ dates, guests, onEditDates }: {
  dates: { checkIn: Date; checkOut: Date }; guests: GuestCounts; onEditDates: () => void;
}) {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const dateLabel = `${fmt(dates.checkIn)} – ${fmt(dates.checkOut)}`;
  const totalGuests = guests.adults + guests.children;
  const guestLabel = `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`;

  return (
    <div className="bg-white">
      <div className="h-px bg-[#eceae7]" />
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[28px] font-semibold tracking-[-0.4px] text-[#191919]">Our Rooms</h2>
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedddb] active:bg-[#f4f4f4]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M3 6H21M6 12H18M10 18H14" />
            </svg>
          </button>
        </div>

        {/* Search pill */}
        <div className="mt-3 flex items-center overflow-hidden rounded-2xl border border-[#dedddb]">
          <button
            onClick={onEditDates}
            className="flex flex-1 flex-col px-4 py-3 text-left active:bg-[#f4f4f4]"
          >
            <span className="text-[11px] font-semibold text-[#191919]">When</span>
            <span className="text-[13px] font-light text-[#6d706f]">{dateLabel}</span>
          </button>
          <div className="h-8 w-px bg-[#eceae7]" />
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#191919]">Who</span>
              <span className="text-[13px] font-light text-[#6d706f]">{guestLabel}</span>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#191919]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Room cards */}
      <div className="space-y-4 px-4 pb-6">
        {ROOMS.map((room) => (
          <div key={room.id} className="overflow-hidden rounded-2xl border border-[#dedddb]">
            <div className="relative h-[190px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={room.image} alt="" className="h-full w-full object-cover" />
              {/* Heart button */}
              <button className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 active:opacity-70">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#191919" strokeWidth="1.5" aria-hidden>
                  <path d="M7 12 2.5 7.5A2.5 2.5 0 0 1 6 3.17 2.5 2.5 0 0 1 7 3.5a2.5 2.5 0 0 1 1-0.33A2.5 2.5 0 0 1 11.5 7.5z" />
                </svg>
              </button>
              {/* 360° badge */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
                <span className="text-[10px] font-light text-white">360° View</span>
              </div>
              {/* Carousel dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </div>
            </div>
            <div className="p-3 pb-4">
              <p className="text-[14px] font-semibold leading-[1.3] text-[#191919]">{room.name}</p>
              <p className="mt-0.5 text-[12px] font-light text-[#6d706f]">
                {room.guests} · {room.size} · {room.bed}
              </p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-[15px] font-semibold text-[#191919]">€{room.price} nightly</span>
                <span className="text-[11px] font-light text-[#6d706f]">Starting member price</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Amenities ─────────────────────────────────────────────────────────────────

function AmenitiesSection() {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? AMENITIES : AMENITIES.slice(0, 8);

  return (
    <div className="bg-white">
      <div className="h-px bg-[#eceae7]" />
      <div className="px-4 pt-6 pb-6">
        <h2 className="mb-5 text-[28px] font-semibold tracking-[-0.4px] text-[#191919]">Amenities</h2>
        <div>
          {list.map((a, i) => (
            <div key={a.name}>
              {i > 0 && <div className="h-px bg-[#eceae7]" />}
              <div className="flex items-center gap-3 py-3.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={a.path} />
                </svg>
                <span className="text-[15px] font-light text-[#191919]">{a.name}</span>
              </div>
            </div>
          ))}
        </div>
        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 flex w-full items-center justify-center rounded-2xl border border-[#dedddb] py-3.5 text-[14px] font-semibold text-[#191919] active:bg-[#f4f4f4]"
          >
            Show all
          </button>
        )}
      </div>
    </div>
  );
}

// ── Spotlight ─────────────────────────────────────────────────────────────────

function SpotlightSection() {
  const [active, setActive] = useState(0);
  const feature = SPOTLIGHT_FEATURES[active];

  return (
    <div className="bg-white">
      <div className="h-px bg-[#eceae7]" />
      {/* Full-bleed image */}
      <div className="relative h-[260px] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={feature.image}
            alt={feature.name}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
      </div>
      {/* Text + nav */}
      <div className="px-4 py-5">
        <h3 className="text-[22px] font-semibold tracking-[-0.3px] text-[#191919]">{feature.name}</h3>
        <p className="mt-1.5 text-[14px] font-light leading-[1.55] text-[#6d706f]">{feature.description}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActive((active - 1 + SPOTLIGHT_FEATURES.length) % SPOTLIGHT_FEATURES.length)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dedddb] active:bg-[#f4f4f4]"
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" strokeLinecap="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setActive((active + 1) % SPOTLIGHT_FEATURES.length)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dedddb] active:bg-[#f4f4f4]"
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" strokeLinecap="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Neighborhood ──────────────────────────────────────────────────────────────

function NeighborhoodSection({ propertyName }: { propertyName: string }) {
  return (
    <div className="bg-white">
      {/* Centered pull quote */}
      <div className="px-4 pb-6 pt-8">
        <p className="text-center text-[20px] font-semibold leading-[1.35] tracking-[-0.3px] text-[#191919]">
          Where the skyline meets the city&apos;s creative streak, {propertyName} gives you front-row access to its iconic boulevard.
        </p>
      </div>
      {/* 2×2 photo collage */}
      <div className="grid grid-cols-2 gap-1 px-4 pb-6">
        {NEIGHBORHOOD_IMGS.map((src, i) => (
          <div key={i} className="aspect-[3/4] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Map ───────────────────────────────────────────────────────────────────────

function MapSection() {
  const [selected, setSelected] = useState<string>(POIS[0].id);

  return (
    <div className="bg-white">
      <div className="h-px bg-[#eceae7]" />
      <div className="px-4 pt-6 pb-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-[#191919]">What around your city</h2>
      </div>
      {/* Map placeholder */}
      <div className="relative mx-4 mb-4 h-[200px] overflow-hidden rounded-2xl bg-[#e8e3dc]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="mgrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mgrid)" />
          <path d="M0 98 Q70 95 140 100 Q210 105 280 98" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M140 0 Q142 50 140 100 Q138 150 140 200" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M0 48 Q70 46 140 48" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M140 145 Q210 148 280 145" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[{ x: 80, y: 88 }, { x: 150, y: 56 }, { x: 200, y: 118 }].map((pos, i) => (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r="9" fill={POIS[i].id === selected ? "#191919" : "white"} stroke="#191919" strokeWidth="1.5" />
              <circle cx={pos.x} cy={pos.y} r="3.5" fill={POIS[i].id === selected ? "white" : "#191919"} />
            </g>
          ))}
        </svg>
      </div>
      {/* POI swim lane */}
      <div className="overflow-x-auto no-scrollbar pl-4 pb-6">
        <div className="flex gap-3 pr-4">
          {POIS.map((poi) => (
            <button
              key={poi.id}
              onClick={() => setSelected(poi.id)}
              className={`flex w-[158px] shrink-0 overflow-hidden rounded-2xl border text-left transition-colors active:opacity-80 ${poi.id === selected ? "border-[#191919]" : "border-[#dedddb]"}`}
            >
              <div className="h-[78px] w-[78px] shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poi.image} alt={poi.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col justify-center px-2.5 py-2">
                <span className="text-[12px] font-semibold leading-tight text-[#191919]">{poi.name}</span>
                <span className="mt-0.5 text-[11px] font-light text-[#6d706f]">{poi.walkTime}</span>
                <div className="mt-0.5 flex items-center gap-0.5">
                  <svg width="9" height="9" viewBox="0 0 20 19" fill="#191919" aria-hidden>
                    <path d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" />
                  </svg>
                  <span className="text-[11px] font-light text-[#191919]">{poi.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Social ────────────────────────────────────────────────────────────────────

function SocialSection() {
  const [current, setCurrent] = useState(0);

  return (
    <div className="bg-white">
      <div className="h-px bg-[#eceae7]" />
      <div className="px-4 pt-8 pb-6">
        <h2 className="mb-5 text-[20px] font-semibold leading-[1.25] tracking-[-0.3px] text-[#191919]">
          Warning: your stay may cause excessive posting
        </h2>
        {/* Story card — 9:16 portrait */}
        <div className="relative mx-auto overflow-hidden rounded-[20px] bg-black" style={{ aspectRatio: "9/16", maxHeight: "320px" }}>
          {/* Progress bars */}
          <div className="absolute left-3 right-3 top-3 z-10 flex gap-1">
            {SOCIAL_IMGS.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: i < current ? "100%" : i === current ? "50%" : "0%" }}
                />
              </div>
            ))}
          </div>
          {/* Image */}
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={SOCIAL_IMGS[current]}
              alt=""
              className="h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          {/* Username */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-white/25 ring-2 ring-white/60" />
            <span className="text-[12px] font-semibold text-white">@numastays</span>
          </div>
          {/* Tap zones */}
          <button className="absolute inset-y-0 left-0 w-1/2" onClick={() => setCurrent(Math.max(0, current - 1))} aria-label="Previous story" />
          <button className="absolute inset-y-0 right-0 w-1/2" onClick={() => setCurrent((current + 1) % SOCIAL_IMGS.length)} aria-label="Next story" />
        </div>
      </div>
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function ReviewsSection() {
  const CARD_W = 258;
  const GAP = 16;
  const STEP = CARD_W + GAP;
  const [offset, setOffset] = useState(0);

  return (
    <div className="bg-white">
      <div className="h-px bg-[#eceae7]" />
      <div className="pt-6 pb-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between px-4">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-0.4px] text-[#191919]">Reviews</h2>
            <div className="mt-1 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 20 19" fill="#191919" aria-hidden>
                <path d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" />
              </svg>
              <span className="text-[14px] font-semibold text-[#191919]">4.63</span>
              <span className="text-[14px] font-light text-[#6d706f]">1033 reviews</span>
            </div>
          </div>
          <div className="mt-1 flex gap-1.5">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - STEP))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedddb] active:bg-[#f4f4f4]"
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
              onClick={() => setOffset((o) => Math.min((REVIEWS.length - 1) * STEP, o + STEP))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedddb] active:bg-[#f4f4f4]"
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
        {/* Cards */}
        <div className="overflow-hidden pl-4">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${offset}px)`, gap: `${GAP}px` }}
          >
            {REVIEWS.map((r) => (
              <div key={r.name} style={{ width: CARD_W }} className="shrink-0 rounded-2xl border border-[#dedddb] p-4">
                <div className="mb-3 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} width="13" height="12" viewBox="0 0 20 19" fill="#191919" aria-hidden>
                      <path d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[13px] font-light leading-[1.55] text-[#191919]">{r.text}</p>
                <div className="mt-3">
                  <p className="text-[13px] font-semibold text-[#191919]">{r.name}</p>
                  <p className="text-[12px] font-light text-[#6d706f]">From {r.source} · {r.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* CTA */}
        <div className="mt-5 px-4">
          <button className="flex w-full items-center justify-center rounded-2xl border border-[#dedddb] py-3.5 text-[14px] font-semibold text-[#191919] active:bg-[#f4f4f4]">
            Show all reviews
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FaqSection() {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setOpenKeys((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <div className="bg-white pb-8">
      <div className="h-px bg-[#eceae7]" />
      {FAQ_GROUPS.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="mx-4 h-px bg-[#eceae7]" />}
          <div className="px-4 pt-6">
            <h2 className="mb-3 text-[28px] font-semibold tracking-[-0.4px] text-[#191919]">{group.title}</h2>
            {group.items.map((item, ii) => {
              const key = `g${gi}-${ii}`;
              const isOpen = openKeys.has(key);
              return (
                <div key={key}>
                  {ii > 0 && <div className="h-px bg-[#eceae7]" />}
                  <button
                    onClick={() => toggle(key)}
                    className="flex w-full items-center justify-between py-4 text-left active:opacity-70"
                  >
                    <span className="pr-4 text-[15px] font-light text-[#191919]">{item.title}</span>
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="1.5" strokeLinecap="round"
                      className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                      aria-hidden
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-[14px] font-light leading-[1.55] text-[#6d706f]">{item.body}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PropertyStep({
  propertyName,
  city,
  heroImage,
  dates,
  guests,
  onBack,
  onEditDates,
}: {
  propertyName: string;
  city: string;
  heroImage: string;
  dates: { checkIn: Date; checkOut: Date };
  guests: GuestCounts;
  onBack: () => void;
  onEditDates: () => void;
}) {
  const openChat = useApp((s) => s.openChat);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Scrollable content — extra bottom padding so last content clears FAB + bar */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
        <HeroSection propertyName={propertyName} city={city} heroImage={heroImage} onBack={onBack} />
        <IntroSection propertyName={propertyName} city={city} />
        <RoomsSection dates={dates} guests={guests} onEditDates={onEditDates} />
        <AmenitiesSection />
        <SpotlightSection />
        <NeighborhoodSection propertyName={propertyName} />
        <MapSection />
        <SocialSection />
        <ReviewsSection />
        <FaqSection />
      </div>

      {/* Ask AI FAB — floats above sticky bar with no white background behind it */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[72px] z-10 flex justify-center py-2">
        <div
          className="pointer-events-auto fab-border"
          style={{ boxShadow: "0px 16px 32px 0px rgba(0,0,0,0.2)" }}
        >
          <div
            className="relative flex items-center overflow-hidden"
            style={{ borderRadius: "16px", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)", background: "rgba(255,255,255,0.85)" }}
          >
            <div className="fab-dots" />
            <button
              onClick={() => openChat({
                kind: "property",
                title: propertyName,
                hint: `The guest is viewing the property page for ${propertyName} in ${city}. Help them decide if it's right for them.`,
                starters: [`Tell me about ${propertyName}`, "What's nearby?", "Is it good for families?"],
              })}
              className="flex h-[56px] shrink-0 items-center gap-1 px-6 text-[16px] font-semibold tracking-[-0.2px] text-[#191919]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG_LUMI_ORB} alt="" className="h-9 w-9 shrink-0 object-cover" />
              Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar — price + Check availability */}
      <div className="shrink-0 border-t border-[#dedddb] bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-light text-[#6d706f]">From</p>
            <p className="text-[17px] font-semibold tracking-[-0.2px] text-[#191919]">€69 nightly</p>
          </div>
          <button className="flex items-center justify-center rounded-2xl bg-[#191919] px-5 py-3 text-[15px] font-semibold text-white active:opacity-80">
            Check availability
          </button>
        </div>
      </div>
    </div>
  );
}
