// The status pill on a trip card — the DS Badge (Figma 7256-11647), a
// rounded-full outline chip with a trailing arrow. Neutral for a stay you can
// already get into; warning for one that still nags you to check in.
//
// Geometry from Figma: px-2 py-[5px], 1px #dedddb border, Label/Small/Bold
// (14px / 600 / 16px line) in a px-1 text container, 16px trailing icon.
// The arrow is the exported Figma glyph, masked so it takes the badge's own
// text colour instead of the export's baked-in #191919.
export function TripBadge({ needsCheckIn }: { needsCheckIn: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center justify-center rounded-full border px-2 py-[5px] ${
        needsCheckIn
          ? "border-[#f6d4c2] bg-[#fff0e9] text-[#b24612]"
          : "border-[#dedddb] bg-white text-[#191919]"
      }`}
    >
      <span className="flex items-center justify-center px-1">
        <span className="whitespace-nowrap text-center text-[14px] font-semibold leading-4 tracking-[-0.2px]">
          {needsCheckIn ? "Check-in required" : "Access now"}
        </span>
      </span>
      <span
        aria-hidden
        className="block size-[16px] shrink-0 bg-current"
        style={{
          maskImage: "url(/icons/badge-arrow.svg)",
          WebkitMaskImage: "url(/icons/badge-arrow.svg)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
    </span>
  );
}
