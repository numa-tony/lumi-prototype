// The status pill on a trip card. A stay you haven't checked into nags you;
// one you're already in just offers the way in.
export function TripBadge({ needsCheckIn }: { needsCheckIn: boolean }) {
  if (needsCheckIn) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fff0e9] px-2.5 py-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b24612" strokeWidth="2.2" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
        <span className="text-[12px] font-semibold leading-4 tracking-[-0.2px] text-[#b24612]">
          Check-in required
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e8f5ee] px-2.5 py-1">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f7a4a" strokeWidth="2.4" aria-hidden>
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[12px] font-semibold leading-4 tracking-[-0.2px] text-[#0f7a4a]">
        Access now
      </span>
    </span>
  );
}
