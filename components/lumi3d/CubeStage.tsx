"use client";

// The seam between the chat and the 3D scene.
//
// Three jobs, all of them about *not* paying for WebGL when it isn't earning
// its keep:
//
//  1. The scene is a lazy, client-only chunk. three + drei is ~400 KB gzipped,
//     which is roughly the size of everything else in this app; the chat's
//     first paint should not wait for it.
//  2. `fade` washes the scene to white. Once it is fully white the canvas
//     *unmounts* — so a scrolling thread costs no rAF, no 1024² refraction
//     buffer, and no shader drawn twice a frame. This is the design decision
//     that makes the cube affordable in a conversation.
//  3. `frozen` swaps in a still. The preview pane stops rAF when hidden, and
//     the presentation build wants baked frames rather than a live renderer —
//     both go through here.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_COMPOSITION, type Backdrop, type CubeComposition } from "./CubeScene";
import { FIELD } from "./GradientBackdrop";

const CubeScene = dynamic(() => import("./CubeScene"), { ssr: false });

/** Canvas teardown waits this long after a full fade, so a fade-in mid-flight doesn't thrash it. */
const UNMOUNT_DELAY_MS = 600;

export interface CubeStageProps {
  composition?: Partial<CubeComposition>;
  /** Which field sits behind the cube. */
  backdrop?: Backdrop;
  gradient?: { pinkStop?: number; sageStop?: number; lobe?: number };
  /** 0 = scene visible, 1 = washed fully to white and unmounted. */
  fade?: number;
  cityId?: string;
  /** Render a still instead of the live scene (baked assets, reduced motion, stage safety). */
  frozen?: boolean;
  /** Source for the still. Falls back to a flat canvas colour when absent. */
  stillSrc?: string;
  forceLowQuality?: boolean;
  className?: string;
}

export function CubeStage({
  composition,
  backdrop = "field",
  gradient,
  fade = 0,
  cityId = "berlin",
  frozen = false,
  stillSrc,
  forceLowQuality,
  className = "",
}: CubeStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const comp: CubeComposition = { ...DEFAULT_COMPOSITION, ...composition };

  // Kept mounted through a partial fade so the wash is visible; dropped once
  // it has been fully white for a beat. Both transitions are scheduled rather
  // than set synchronously, so neither cascades a render — the extra frame
  // before re-mounting is invisible next to the canvas's own warm-up.
  const [unmounted, setUnmounted] = useState(fade >= 1);
  useEffect(() => {
    if (fade >= 1) {
      const t = setTimeout(() => setUnmounted(true), UNMOUNT_DELAY_MS);
      return () => clearTimeout(t);
    }
    const r = requestAnimationFrame(() => setUnmounted(false));
    return () => cancelAnimationFrame(r);
  }, [fade]);
  const mounted = !unmounted;

  return (
    <div ref={host} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* The scene's own ground colour, so the sheet is never transparent
          mid-swap and a lazy chunk never lands on the wrong background. */}
      <div
        className="absolute inset-0"
        style={{ background: backdrop === "gradient" ? FIELD.top : "#f7f3f0" }}
      />

      {frozen ? (
        stillSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stillSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null
      ) : mounted ? (
        <CubeScene
          composition={comp}
          backdrop={backdrop}
          gradient={gradient}
          cityId={cityId}
          forceLowQuality={forceLowQuality}
          pointerTarget={host}
        />
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-500 ease-out"
        style={{ opacity: fade }}
      />
    </div>
  );
}
