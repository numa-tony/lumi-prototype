"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { LUMI_KNOT_SIZE } from "@/components/lumi-knot/LumiKnot";

// Moves the Lumi knot around the story chat the way numa-lumi-branding's v7
// does. There is one knot — one canvas, one WebGL context — living in an
// overlay above the chat. The layout only holds empty *anchors* where the knot
// should sit, and the overlay is transformed on top of whichever anchor is
// active:
//
//   start    the 227px anchor on the start screen — idle
//   loading  the 36px anchor where Lumi's answer will land — thinking
//   hidden   fades out where it stands; the answer takes its place
//
// start → loading glides (v7's 600ms move, the first question). Everything else
// is instant with a 200ms fade — a second question brings the knot back in
// place under her new message rather than flying in from the last one. A ←
// snap, reduced motion and the first mount are instant too.

export type KnotMode = "start" | "loading" | "hidden";

/** v7.html: FLOW.moveMs, --ease-out, and the wrapper's opacity fade. */
const GLIDE_MS = 600;
const FADE = "opacity 200ms ease";
const GLIDE = `transform ${GLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), ${FADE}`;

type Target = { transform: string; clip: string };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useKnotPlacement(mode: KnotMode) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bigAnchorRef = useRef<HTMLDivElement>(null);
  const smallAnchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const modeRef = useRef<KnotMode | null>(null);
  const glideUntil = useRef(0);
  const applied = useRef<Target>({ transform: "", clip: "" });

  // Everything below runs outside render: the knot moves with DOM writes, so a
  // scrolling thread or a sliding sheet never re-renders the chat.

  /** Where the knot belongs right now, or null when there's no anchor for it. */
  function measure(m: KnotMode): Target | null {
    const root = rootRef.current;
    const anchor = m === "start" ? bigAnchorRef.current : m === "loading" ? smallAnchorRef.current : null;
    if (!root || !anchor) return null;
    // Measured against the chat's own root, not the screen: both ride the
    // sheet's slide, so the difference holds mid-slide. Rects are in screen
    // px and the transform is in the root's own px — divide out any scale an
    // ancestor carries.
    const s = root.getBoundingClientRect();
    const k = root.offsetWidth ? s.width / root.offsetWidth : 1;
    const r = anchor.getBoundingClientRect();
    const x = (r.left - s.left) / k;
    const y = (r.top - s.top) / k;
    const scale = r.width / k / LUMI_KNOT_SIZE;
    // In the thread the knot is clipped to the message list, so a smooth
    // scroll can't carry it over the composer or under the pinned request.
    let clip = "none";
    const list = listRef.current;
    if (m === "loading" && list) {
      const l = list.getBoundingClientRect();
      clip = `inset(${((l.top - s.top) / k).toFixed(1)}px 0px ${((s.bottom - l.bottom) / k).toFixed(1)}px 0px)`;
    }
    return {
      transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`,
      clip,
    };
  }

  function write(t: Target) {
    const wrap = wrapRef.current;
    const layer = layerRef.current;
    if (!wrap || !layer) return;
    if (t.transform !== applied.current.transform) {
      wrap.style.transform = t.transform;
      applied.current.transform = t.transform;
    }
    if (t.clip !== applied.current.clip) {
      layer.style.clipPath = t.clip;
      applied.current.clip = t.clip;
    }
  }

  // After every render: a new mode decides how the knot gets there; otherwise
  // just keep it on its anchor.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const prev = modeRef.current;
    modeRef.current = mode;
    const t = measure(mode);

    if (prev === mode) {
      if (t) write(t);
      return;
    }

    const instant = prev === null || useApp.getState().demo.stage.instant || prefersReducedMotion();
    if (mode === "hidden" || !t) {
      wrap.style.transition = instant ? "none" : FADE;
      wrap.style.opacity = "0";
      glideUntil.current = 0;
      return;
    }
    const glide = !instant && prev === "start" && mode === "loading";
    wrap.style.transition = instant ? "none" : glide ? GLIDE : FADE;
    glideUntil.current = glide ? performance.now() + GLIDE_MS : 0;
    write(t);
    wrap.style.opacity = "1";
  });

  // Every frame while it's showing: follow the anchor as the thread scrolls,
  // the composer grows or the sheet resizes. Outside a glide the transform has
  // no transition, so it tracks exactly; inside one, a moved anchor just
  // retargets the glide.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (glideUntil.current && performance.now() > glideUntil.current) {
        glideUntil.current = 0;
        wrap.style.transition = FADE;
      }
      const m = modeRef.current;
      if (m === null || m === "hidden") return;
      const t = measure(m);
      if (t) write(t);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // measure/write only read refs, so the loop never needs restarting.
  }, []);

  return { rootRef, bigAnchorRef, smallAnchorRef, listRef, layerRef, wrapRef };
}
