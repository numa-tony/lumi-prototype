"use client";

import { GUEST } from "@/lib/mock/guest";

const ROWS = [
  { emoji: "👤", label: "Personal information" },
  { emoji: "💳", label: "Payment methods" },
  { emoji: "🎁", label: "Member benefits" },
  { emoji: "🔔", label: "Notifications" },
  { emoji: "🌐", label: "Language & region" },
  { emoji: "❓", label: "Help & support" },
];

export function ProfileScreen() {
  return (
    <div className="px-5 pb-28 pt-14">
      <h1 className="text-[30px] font-semibold tracking-tight text-ink">Profile</h1>

      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lumi-pink text-[24px] font-semibold text-ink">
          {GUEST.firstName[0]}
          {GUEST.fullName.split(" ")[1]?.[0]}
        </span>
        <div>
          <p className="text-[18px] font-semibold text-ink">{GUEST.fullName}</p>
          <p className="text-[13px] text-ink-soft">Numa member · Gold</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        {ROWS.map((r, i) => (
          <button
            key={r.label}
            className={`flex w-full items-center gap-3 px-4 py-4 text-left active:bg-surface-muted ${i > 0 ? "border-t border-line" : ""}`}
          >
            <span className="text-[20px]">{r.emoji}</span>
            <span className="flex-1 text-[15px] font-medium text-ink">{r.label}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint" aria-hidden><path d="m9 6 6 6-6 6" strokeLinecap="round" /></svg>
          </button>
        ))}
      </div>

      <button className="mt-5 w-full rounded-2xl border border-line py-3.5 text-[15px] font-semibold text-numa active:bg-surface-muted">
        Sign out
      </button>
    </div>
  );
}
