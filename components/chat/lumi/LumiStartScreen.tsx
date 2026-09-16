"use client";

// Lumi's start screen — Figma 7274-12724.
//
// One screen for both chats. The live and scripted views had separate start
// screens before this ("Numa" + a big torus on white vs. the torus + "I'm
// Lumi, your travel assistant" on a pink gradient); they now differ only in
// what they pass in.
//
// Two things replace the old design: the torus becomes the glass cube, and the
// flat sheet becomes the cube's own lit field, rendered live. The frame's
// greeting is personal — "Hi Sarah" — so the name comes from the guest data
// rather than being painted into the copy.
//
// Vertical positions are the frame's own, measured from the sheet's top edge
// (the frame's sheet starts at 72px: a 62px status bar plus the sheet's 10px
// inset). The sheet is 802px tall there and 812 here, so those offsets port
// within about a percent. Horizontal gutters are literal — they don't scale.
import { CubeStage } from "@/components/lumi3d/CubeStage";
import type { Backdrop, CubeComposition } from "@/components/lumi3d/CubeScene";
import { AskLumiInput } from "./AskLumiInput";

/**
 * Where the cube sits on the start screen, measured against frame 7274-12724
 * rather than eyeballed: at these values the rendered cube matches the frame's
 * to within 0.3% on width, top and bottom edge. Re-check with
 * `node scripts/shoot-lab.mjs --url ".../lab?chrome=0"` if the upstream cube
 * changes size.
 */
export const IDLE_CUBE: CubeComposition = { scale: 0.7, offsetX: 0, offsetY: 0.95, reveal: 1 };

/**
 * Where the frame puts each element, in px from the top of the sheet.
 *
 * Careful with the frame's coordinates: the greeting and subtitle are absolute
 * inside the Sheet, so their numbers are already sheet-relative, while the
 * starters are absolute in the outer 874px frame and need the 72px status-bar
 * + inset subtracted (670 → 598).
 */
export const START_LAYOUT = {
  greetingTop: 407,
  subtitleTop: 461,
  startersTop: 598,
  startersLeft: 32,
  startersGap: 16,
  composerGutter: 12,
  composerFoot: 32,
};

export interface LumiStartScreenProps {
  /** First name for the greeting. */
  name: string;
  subtitle?: string;
  starters?: string[];
  /** A starter shown mid-press, for the scripted story's visible taps. */
  pressedStarter?: string | null;
  onStarter?: (starter: string) => void;
  /** Draft in the composer. The scripted story types into this. */
  draft?: string;
  onSend?: () => void;
  onMic?: () => void;

  // — scene —
  cubeComposition?: Partial<CubeComposition>;
  /** "field" = the lit canvas (7274-12724); "gradient" = pink→sage (7206-14806). */
  backdrop?: Backdrop;
  gradient?: { pinkStop?: number; sageStop?: number; lobe?: number };
  /** 0 = lit field, 1 = washed to white (and the canvas unmounted). */
  sceneFade?: number;
  /** Show a baked still instead of the live renderer. */
  frozen?: boolean;
  stillSrc?: string;
  cityId?: string;
  /** Override the frame's measurements — the lab passes tuned values. */
  layout?: Partial<typeof START_LAYOUT>;
}

export function LumiStartScreen({
  name,
  subtitle = "What can I help you with?",
  starters = [],
  pressedStarter = null,
  onStarter,
  draft = "",
  onSend,
  onMic,
  cubeComposition = IDLE_CUBE,
  backdrop = "field",
  gradient,
  sceneFade = 0,
  frozen = false,
  stillSrc,
  cityId = "berlin",
  layout,
}: LumiStartScreenProps) {
  const L = { ...START_LAYOUT, ...layout };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <CubeStage
        composition={cubeComposition}
        backdrop={backdrop}
        gradient={gradient}
        fade={sceneFade}
        frozen={frozen}
        stillSrc={stillSrc}
        cityId={cityId}
      />

      {/* Everything above the scene. `relative` rather than absolute so the
          composer can still sit in normal flow at the foot. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Headline/Medium and Title/Large, both content/base/secondary —
            the frame greys the greeting rather than setting it in ink. */}
        <p
          className="absolute inset-x-0 text-center text-[36px] font-semibold leading-[44px] tracking-[-0.4px] text-text-secondary"
          style={{ top: L.greetingTop }}
        >
          Hi {name}
        </p>
        <p
          className="absolute inset-x-0 text-center text-[20px] font-light leading-[28px] tracking-[-0.2px] text-text-secondary"
          style={{ top: L.subtitleTop }}
        >
          {subtitle}
        </p>

        {starters.length > 0 && (
          <div
            className="absolute flex flex-col items-start"
            style={{ top: L.startersTop, left: L.startersLeft, gap: L.startersGap }}
          >
            {starters.map((s) => (
              // Body/Small. The frame carries a 16px leading icon per row, but
              // every one of them is hidden, so they stay off here too.
              <button
                key={s}
                type="button"
                onClick={() => onStarter?.(s)}
                className={`text-left text-[14px] font-light leading-[20px] tracking-[-0.2px] text-text-secondary transition-opacity duration-150 ${
                  pressedStarter === s ? "opacity-45" : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <AskLumiInput
            draft={draft}
            gutter={L.composerGutter}
            foot={L.composerFoot}
            onSend={onSend}
            onMic={onMic}
          />
        </div>
      </div>
    </div>
  );
}
