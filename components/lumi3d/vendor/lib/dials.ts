// ⚠️  GENERATED — DO NOT EDIT.
// Written from components/lumi3d/overrides/lib/dials.ts by scripts/sync-lumi3d.mjs.
// This module deliberately replaces the upstream one. Edit the override.

// The upstream module wires a DialKit panel to ~37 shader uniforms. Here it is
// a defaults-only stub, on purpose.
//
// branding-v2 is where the cube's look gets tuned; this repo only decides how
// it sits in a chat sheet. Two live panels editing one shader is how the two
// repos drift, so the prototype reads the tuned defaults and nothing else.
// Those defaults are the DIALS object at the top of directions/cube/index.tsx,
// which upstream calls "the single source of truth" — this keeps that true.
//
// Dropping DialKit also drops a 7.5 MB dependency and its localStorage
// persistence, which would have needed client-only guards under Next.
import type { DialConfig } from "dialkit";
import type { Tweaks, TweakValue } from "../directions/types";

export const dialPanelId = (directionId: string) => `lumi-${directionId}`;

/** The config's defaults, flattened to the dot paths a frame loop reads. */
export function dialDefaults(config: DialConfig | undefined, prefix = "", out: Tweaks = {}): Tweaks {
  if (!config) return out;
  for (const [key, value] of Object.entries(config)) {
    if (key === "_collapsed") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) out[path] = value[0] as TweakValue;
    else if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") out[path] = value;
    else if (value && typeof value === "object" && !("type" in value)) dialDefaults(value as DialConfig, path, out);
  }
  return out;
}

/** No panel to subscribe to, so the holder is seeded once and never changes. */
export function syncDials(_panelId: string, config: DialConfig | undefined, holder: { current: Tweaks }): () => void {
  holder.current = dialDefaults(config);
  return () => {};
}

/** Read a numeric dial, falling back when the path has no default. */
export const num = (t: Tweaks, path: string, fallback: number) =>
  typeof t[path] === "number" ? (t[path] as number) : fallback;

export type { TweakValue };

/**
 * Upstream this subscribes a component to one dial. With no panel it is a
 * constant — but it must stay a hook, because the vendored scene calls it
 * unconditionally in render.
 */
export function useDialValue(_panelId: string, _path: string, fallback: number): number {
  return fallback;
}
