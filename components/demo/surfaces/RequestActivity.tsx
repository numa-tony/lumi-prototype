"use client";

// The three renderings of one live request. All read the same countdown
// (lib/demo/request.ts), so the minutes on the pinned card, the Dynamic Island
// and the lock screen never disagree with each other mid-talk.

import type { RequestProgress, RequestState } from "@/lib/demo/request";

const NUMA_PINK = "#ffc9d2";
const NUMA_ORANGE = "#ff671f";

// A small isometric technician, drawn rather than shipped as an asset.
function TechnicianGlyph({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="4" y="21" width="18" height="14" rx="2" fill="#e8e4df" />
      <path d="M4 21l9-5 9 5-9 5-9-5Z" fill="#f6f3ef" />
      <path d="M22 21v14l8-4V17l-8 4Z" fill="#d6d1cb" />
      <circle cx="27" cy="11" r="4" fill="#f2c9a8" />
      <path d="M23 11a4 4 0 0 1 8 0h-8Z" fill={NUMA_ORANGE} />
      <path d="M22.5 16h9l1.5 12h-12l1.5-12Z" fill="#4f7ec8" />
      <rect x="30" y="18" width="6" height="2.4" rx="1.2" fill="#f2c9a8" transform="rotate(20 30 18)" />
    </svg>
  );
}

// ── 1. Pinned card at the top of the Lumi thread ─────────────────────────────

export function RequestPinnedCard({
  request,
  progress,
}: {
  request: RequestState;
  progress: RequestProgress;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#f0eeec] bg-surface shadow-[0_6px_24px_-8px_rgba(0,0,0,0.18)]">
      {/* pink wash toward the bottom, per the Figma card */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,225,232,0.55) 100%)" }}
      />
      <div className="relative px-4 pb-3.5 pt-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-[1px] text-[17px] leading-none">🔧</span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-tight tracking-[-0.2px] text-ink">
              {request.title}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[14px] font-light text-[#6d706f]">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#12a05c]" />
              {progress.etaText}
            </p>
          </div>
        </div>

        {/* progress rail — filled to the elapsed share, open dot at the ETA */}
        <div className="relative mt-4 h-[7px]">
          <div className="absolute inset-x-0 top-[2px] h-[3px] rounded-full bg-[#e3e1df]" />
          <div
            className="absolute left-0 top-[2px] h-[3px] rounded-full bg-[#2f2f2f] transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(4, progress.progress * 100)}%` }}
          />
          <span className="absolute right-0 top-0 h-[7px] w-[7px] rounded-full border-[1.5px] border-[#2f2f2f] bg-surface" />
        </div>

        <div className="mt-2 flex items-start justify-between">
          <div>
            <p className="text-[12px] font-light text-[#6d706f]">{request.receivedLabel}</p>
            <p className="text-[12px] font-light text-[#9a9a9a]">{request.receivedCaption}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-light text-[#6d706f]">{request.etaLabel}</p>
            <p className="text-[12px] font-light text-[#9a9a9a]">{request.etaCaption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Dynamic Island — compact pill ⇄ expanded Live Activity ────────────────

export function DynamicIsland({
  request,
  progress,
  expanded,
}: {
  request: RequestState | null;
  progress: RequestProgress | null;
  expanded: boolean;
}) {
  const showActivity = Boolean(request && progress);
  const isExpanded = expanded && showActivity;

  // Deliberately a CSS transition, not a motion component: the island has to
  // morph reliably on stage, and content must be legible the instant it's
  // there rather than waiting on an animation to resolve.
  return (
    <div
      className="absolute left-1/2 top-[11px] z-50 overflow-hidden bg-black"
      style={{
        width: isExpanded ? 318 : showActivity ? 152 : 120,
        height: isExpanded ? 92 : 36,
        borderRadius: isExpanded ? 24 : 18,
        transform: "translateX(-50%)",
        transition: "width 380ms cubic-bezier(0.32,0.72,0,1), height 380ms cubic-bezier(0.32,0.72,0,1), border-radius 380ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      {showActivity && !isExpanded && (
        <div className="flex h-9 items-center justify-between px-3.5">
          <span className="text-[13px] font-semibold tracking-[-0.2px]" style={{ color: NUMA_PINK }}>
            Numa
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-white">
            {progress!.shortText}
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="flex h-full flex-col justify-center px-3.5 py-3">
          <div className="flex items-center gap-3">
            <TechnicianGlyph size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight text-white">
                {request!.title}
              </p>
              <p className="truncate text-[13px] font-light text-white/55">{progress!.longText}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="shrink-0 text-[10px] font-light tabular-nums text-white/60">
              {request!.receivedLabel}
            </span>
            <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.max(4, progress!.progress * 100)}%`, background: NUMA_PINK }}
              />
            </span>
            <span className="shrink-0 text-[10px] font-light tabular-nums text-white/60">
              {request!.etaLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. Lock-screen Live Activity ─────────────────────────────────────────────

export function LockActivity({
  request,
  progress,
}: {
  request: RequestState;
  progress: RequestProgress;
}) {
  return (
    <div
      className="overflow-hidden rounded-[22px] px-4 py-3.5"
      style={{ background: "rgba(28,30,34,0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold leading-tight" style={{ color: NUMA_PINK }}>
            Numa
          </p>
          <p className="mt-1 truncate text-[14px] font-semibold text-white">{request.title}</p>
          <p className="truncate text-[13px] font-light text-white/55">{progress.longText}</p>
        </div>
        <TechnicianGlyph size={38} />
      </div>
      <div className="relative mt-3 h-[5px]">
        <div className="absolute inset-x-0 top-[1px] h-[3px] rounded-full bg-white/20" />
        <div
          className="absolute left-0 top-[1px] h-[3px] rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.max(4, progress.progress * 100)}%`, background: NUMA_PINK }}
        />
        <span
          className="absolute right-0 top-0 h-[5px] w-[5px] rounded-full"
          style={{ background: NUMA_PINK }}
        />
      </div>
    </div>
  );
}
