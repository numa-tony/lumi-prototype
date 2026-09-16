"use client";

import { useEffect, useRef, useState } from "react";

// Lumi's live presence: the holographic torus knot from numa-lumi-branding
// (v7), vendored verbatim into ./vendor by scripts/sync-lumi-knot.mjs. This
// component only owns its lifetime — create on mount, dispose on unmount — and
// which state it's in. Everything about how it looks lives upstream.

/** The knot's canvas edge, CSS px. Upstream's default; smaller sizes are a CSS scale of this render. */
export const LUMI_KNOT_SIZE = 227;

export type LumiKnotState = "idle" | "thinking";

type Knot = { setState: (state: string) => void; dispose: () => void };

export function LumiKnot({ state }: { state: LumiKnotState }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const knotRef = useRef<Knot | null>(null);
  // Read by the async create below, so a state change that lands before
  // three.js has loaded still reaches the knot.
  const stateRef = useRef(state);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Loaded on demand: three.js stays out of the first load, and only arrives
    // the first time a chat opens.
    import("./vendor/lumi-knot.js").then(
      ({ createKnot }) => {
        if (cancelled || !hostRef.current) return;
        try {
          const knot = createKnot(hostRef.current) as Knot;
          knot.setState(stateRef.current);
          knotRef.current = knot;
        } catch (e) {
          // No WebGL (or a context the browser refused) — fall back to the still.
          console.error("Lumi knot failed to start:", e);
          setFailed(true);
        }
      },
      (e) => {
        console.error("Lumi knot failed to load:", e);
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      knotRef.current?.dispose();
      knotRef.current = null;
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
    knotRef.current?.setState(state);
  }, [state]);

  return (
    <div ref={hostRef} style={{ width: LUMI_KNOT_SIZE, height: LUMI_KNOT_SIZE }}>
      {failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/lumi-torus.png" alt="" className="h-full w-full object-contain" />
      )}
    </div>
  );
}
