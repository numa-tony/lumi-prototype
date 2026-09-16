"use client";

// The DS "List Items" row (Figma 8313:14216 / 8313:14180).
//
// Two shapes share one component:
//   • two-line — 16/20 semibold title over a 16/24 light subtitle, icon pinned
//     14px from the top so it aligns with the title's cap height, content py-2.
//   • one-line — 40px tall, 16/20 light label, everything vertically centred.
//
// Both are gap-4 (16px) icon → content → 24px chevron.

const CHEVRON = "/trip/chevron-right.svg";

export function ListItem({
  icon,
  title,
  subtitle,
  onClick,
  chevron = true,
}: {
  // An exported Figma glyph (path), or an inline node for icons the DS
  // hasn't published yet.
  icon: string | React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  // The DS row's Right Addon is optional — Your room's fact lists have none.
  chevron?: boolean;
}) {
  const twoLine = subtitle !== undefined;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 text-left active:opacity-70 ${
        twoLine ? "" : "h-10"
      }`}
    >
      {/* Left addon — top-aligned on the two-line row, centred on the one-liner */}
      <span
        className={`flex shrink-0 self-stretch ${
          twoLine ? "items-start pt-[14px]" : "items-center py-2"
        }`}
      >
        {typeof icon === "string" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="block size-[24px]" />
        ) : (
          <span className="block size-[24px]">{icon}</span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-[2px] py-2">
        <span
          className={`text-[16px] leading-5 tracking-[-0.2px] text-[#191919] ${
            twoLine ? "font-semibold" : "font-light"
          }`}
        >
          {title}
        </span>
        {twoLine && (
          <span className="text-[16px] font-light leading-6 tracking-[-0.2px] text-[#6d706f]">
            {subtitle}
          </span>
        )}
      </span>

      {chevron && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={CHEVRON} alt="" className="block size-[24px] shrink-0" />
      )}
    </button>
  );
}

// Divider / Full-width, horizontal — outline/default/light.
export function ListDivider() {
  return <div className="h-px w-full bg-[#eceae7]" />;
}
