"use client";

// The `Inputs` contract the vendored cube reads every frame — but only the
// half of it a chat sheet can afford.
//
// Upstream's input layer also does drag-to-tumble, tap-to-wobble, swipe and
// chrome toggling, and it calls `setPointerCapture` on pointerdown. Inside a
// bottom sheet that is actively harmful: capture would swallow taps meant for
// the starters and the composer, and a draggable cube fights both the sheet's
// dismiss gesture and the thread's scroll.
//
// So this keeps the ambient half — the smoothed parallax that aims the one
// light, which is what makes the scene feel lit rather than painted — and
// leaves drag permanently at rest. Listeners are passive and live on the
// screen container, so they observe pointer movement without intercepting it.
import { useCallback, useEffect, useRef } from "react";
import type { Inputs } from "./vendor/directions/types";

/** Seconds for parallax to cover half the distance to the pointer. */
const PARALLAX_HALFLIFE = 0.18;
/** Device tilt, in degrees, that maps to the full ±1 range. */
const TILT_RANGE = 22;

export interface AmbientInputs {
  inputs: Inputs;
  /** Call once per frame with dt. Advances the parallax smoothing. */
  tick: (dt: number) => void;
}

export function useAmbientInputs(
  target: React.RefObject<HTMLElement | null>,
  { enabled = true }: { enabled?: boolean } = {},
): AmbientInputs {
  // A ref, not a memo: these holders are written every frame by design, and a
  // ref is the one shape React sanctions for that. The scene reads them
  // directly, so tuning or moving the pointer never re-renders the Canvas.
  const store = useRef<Inputs | null>(null);
  if (store.current === null) {
    store.current = {
      dials: { current: {} },
      reveal: { current: 0 },
      mode: { current: { state: "idle", option: "", at: 0 } },
      parallax: { current: { x: 0, y: 0 } },
      // Permanently at rest. The cube still reads it every frame; it just
      // never finds anything there.
      drag: {
        current: { active: false, yaw: 0, pitch: 0, vyaw: 0, vpitch: 0, tapAt: 0, tapX: 0, tapY: 0, pressAt: 0 },
      },
    };
  }
  const inputs = store.current;

  const aim = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      aim.current = { x: 0, y: 0 };
      return;
    }
    const el = target.current;
    if (!el) return;

    // Normalised to the element, not the window: the phone frame is a small
    // island on a wide stage, and the light should track the pointer across
    // the *screen* it is lighting.
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      aim.current = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -(((e.clientY - r.top) / r.height) * 2 - 1),
      };
    };
    const leave = () => {
      aim.current = { x: 0, y: 0 };
    };
    const orient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      aim.current = {
        x: Math.max(-1, Math.min(1, e.gamma / TILT_RANGE)),
        y: Math.max(-1, Math.min(1, (e.beta - 45) / TILT_RANGE)),
      };
    };

    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("deviceorientation", orient);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("deviceorientation", orient);
    };
  }, [target, enabled]);

  const tick = useCallback((dt: number) => {
    const p = store.current?.parallax.current;
    if (!p) return;
    const k = 1 - Math.pow(0.5, dt / PARALLAX_HALFLIFE);
    p.x += (aim.current.x - p.x) * k;
    p.y += (aim.current.y - p.y) * k;
  }, []);

  return { inputs, tick };
}
