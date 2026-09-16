// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/types.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

import type { FC } from 'react'
import type { DialConfig } from 'dialkit'
import type { City } from '../lib/cities'

/**
 * Accumulated direct-manipulation state. The shell integrates pointer input
 * into this every frame (inertia while free, spring back to rest when let go)
 * so a direction only has to *read* it. A solid object maps yaw/pitch onto a
 * rotation; a light phenomenon might sway or shear instead.
 */
export interface DragState {
  /** pointer is down on the entity right now */
  active: boolean
  /** accumulated tumble, radians. yaw = around Y, pitch = around X */
  yaw: number
  pitch: number
  /** angular velocity, rad/s (carries momentum after release) */
  vyaw: number
  vpitch: number
  /** last tap on the entity: performance.now() ms (0 = never) and NDC (-1..1) */
  tapAt: number
  tapX: number
  tapY: number
  /** pointer-down on the entity: performance.now() ms (0 = not pressed). Press feedback should start here, not on release. */
  pressAt: number
}

/** The entity's states. Phase 2 adds them one at a time; idle is the rest state every direction already has. */
export type EntityStateId = 'idle' | 'thinking'

/** One candidate design for a state (phase 2 explores three per state before one is chosen). */
export interface StateOption {
  id: string
  /** one word, the pill label */
  name: string
  /** what the option does, in a line */
  oneLiner: string
}

export interface EntityMode {
  state: EntityStateId
  /** which of the direction's options for that state is showing */
  option: string
  /** performance.now() ms when the state last changed */
  at: number
}

export interface Inputs {
  /** the tweak panel's live values, keyed by dot path ('rays.strength'). Mutated by a DialKit subscription, never a React prop, so moving a slider does not re-render the scene. */
  dials: { current: Tweaks }
  /** 0..1, shell-driven. Rises on entrance, falls on exit. A direction *materializes* with it. */
  reveal: { current: number }
  /** the entity's current state and design option; shell-driven. Read every frame, blend from the current value. */
  mode: { current: EntityMode }
  /** smoothed parallax, -1..1 on both axes. Pointer on desktop, device tilt on a phone. */
  parallax: { current: { x: number; y: number } }
  drag: { current: DragState }
}

export type TweakValue = number | string | boolean
export type Tweaks = Record<string, TweakValue>

export interface DirectionProps {
  city: City
  inputs: Inputs
  reducedMotion: boolean
  /** 'low' on phones: fewer samples, lower dpr, no expensive passes */
  quality: 'high' | 'low'
}

export interface Direction {
  id: string
  /** one word, the caption title */
  name: string
  /** the caption under the entity, max ~12 words */
  oneLiner: string
  camera?: { position: [number, number, number]; fov: number }
  /** the direction's candidate designs for the thinking state (the states page shows them as pills) */
  thinkingOptions?: StateOption[]
  /** DialKit config for the direction's tunables: folders are nested objects, sliders are [default, min, max, step]. Live values arrive through `inputs.dials`. */
  dials?: DialConfig
  /** Full-viewport background. Rendered inside the Canvas before the entity. Fades with inputs.reveal. */
  Background: FC<DirectionProps>
  /** The entity, centred on the origin, hero scale ≈ 1 unit radius. Materializes with inputs.reveal. */
  Entity: FC<DirectionProps>
  /** Optional postprocessing (an EffectComposer). Only the mounted direction's effects run. */
  Effects?: FC<DirectionProps>
}
