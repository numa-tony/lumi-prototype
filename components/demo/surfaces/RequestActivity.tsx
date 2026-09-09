"use client";

// The three renderings of one live request. All read the same countdown
// (lib/demo/request.ts), so the minutes on the pinned card, the Dynamic Island
// and the lock screen never disagree with each other mid-talk.

import type { RequestProgress, RequestState } from "@/lib/demo/request";

const NUMA_PINK = "#ffc9d2";

// The technician, exported from the Figma Live Activity so the widget carries
// the same 3D asset as the design rather than a stand-in.
const IMG_TECHNICIAN = "/allhands/technician.png";

function Technician({ width }: { width: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={IMG_TECHNICIAN}
      alt=""
      className="shrink-0 object-contain"
      style={{ width, height: (width / 46) * 54 }}
    />
  );
}

// The live-status dot: a 12px halo around a 6px core (Figma 7224:10821), with
// a ring pulsing out from under the halo so the request reads as a live feed.
function LiveDot() {
  return (
    <span className="relative flex h-[12px] w-[12px] shrink-0 items-center justify-center">
      <span className="live-dot-ring absolute inset-0 rounded-full bg-[var(--color-green-200)]" />
      <span className="absolute inset-0 rounded-full bg-[var(--color-green-100)]" />
      <span className="relative h-[6px] w-[6px] rounded-full bg-[var(--color-green-400)]" />
    </span>
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
            <p className="mt-1 flex items-center gap-1 text-[14px] font-light text-[#6d706f]">
              <LiveDot />
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

  // Sizes come off the Figma frames (compact 173×38, expanded 367×146 on a
  // 402-wide artboard) scaled to this 390-wide phone.
  // A CSS transition rather than a motion component: the island has to morph
  // reliably on stage, and its content must be legible the instant it's there.
  //
  // Opening springs past the target and settles, the way the real island does.
  // The overshoot is mostly vertical: expanded, the island is already 91% of
  // the screen, so more than a couple of percent of width would clip on the
  // display's rounded corners. Closing eases straight out — iOS doesn't bounce
  // a Live Activity shut.
  const ease = isExpanded
    ? {
        width: "cubic-bezier(0.32, 1.18, 0.5, 1)",   // ~1.5% past — stays clear of the corners
        height: "cubic-bezier(0.34, 1.5, 0.5, 1)",   // ~7% past — room to actually bounce
      }
    : { width: "cubic-bezier(0.32, 0.72, 0, 1)", height: "cubic-bezier(0.32, 0.72, 0, 1)" };

  return (
    <div
      className="absolute left-1/2 z-50 overflow-hidden bg-black"
      style={{
        // Proportions of the Figma artboard (402×874) so the island tracks the
        // phone whatever size the frame renders at.
        width: isExpanded ? "91.3%" : showActivity ? "43%" : "29.9%",
        height: isExpanded ? "16.7%" : "4.35%",
        top: "1.49%",
        borderRadius: isExpanded ? 39 : 18,
        transform: "translateX(-50%)",
        transition: [
          `width 560ms ${ease.width}`,
          `height 560ms ${ease.height}`,
          // The corner radius just eases — overshooting it reads as a wobble.
          "border-radius 460ms cubic-bezier(0.32, 0.72, 0, 1)",
        ].join(", "),
      }}
    >
      {showActivity && !isExpanded && (
        <div className="flex h-full items-center justify-between px-4">
          <span className="text-[13px] font-semibold tracking-[-0.2px]" style={{ color: NUMA_PINK }}>
            Numa
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-white">
            {progress!.shortText}
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="flex h-full flex-col justify-center px-[21px]">
          <div className="flex items-center gap-4">
            <Technician width={42} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-[18px] text-white">
                {request!.title}
              </p>
              <p className="mt-[3px] truncate text-[14px] font-light leading-[18px] text-white/55">
                {progress!.longText}
              </p>
            </div>
          </div>
          <div className="mt-[14px] flex items-center gap-3">
            <span className="shrink-0 text-[12px] font-light tabular-nums text-white/70">
              {request!.receivedLabel}
            </span>
            <span className="relative h-[6.5px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.max(4, progress!.progress * 100)}%`, background: NUMA_PINK }}
              />
            </span>
            <span className="shrink-0 text-[12px] font-light tabular-nums text-white/70">
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
      className="overflow-hidden rounded-[24px] px-[19px] py-[22px]"
      style={{
        background: "rgba(28,30,34,0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[22px] font-semibold leading-[28px] tracking-[-0.3px]" style={{ color: NUMA_PINK }}>
            Numa
          </p>
          <p className="mt-[10px] truncate text-[15px] font-semibold leading-[16px] text-white">
            {request.title}
          </p>
          <p className="mt-[10px] truncate text-[15px] font-light leading-[16px] text-white/55">
            {progress.longText}
          </p>
        </div>
        <Technician width={42} />
      </div>
      <div className="relative mt-[22px] h-[4px]">
        <div className="absolute inset-x-0 top-0 h-[4px] rounded-full bg-white/25" />
        <div
          className="absolute left-0 top-0 h-[4px] rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.max(4, progress.progress * 100)}%`, background: NUMA_PINK }}
        />
        <span
          className="absolute -top-[3px] right-0 h-[10px] w-[10px] rounded-full"
          style={{ background: NUMA_PINK }}
        />
      </div>
    </div>
  );
}
