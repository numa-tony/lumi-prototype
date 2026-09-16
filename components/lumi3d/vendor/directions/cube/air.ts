// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/cube/air.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// The air the light comes through.
//
// Two things live here. The Breeze is the slow rhythm: a constant low sway
// with seeded gusts on top, so the set of rays swells and settles instead of
// looping. And `pleatAt` is a CPU mirror of the shader's band field, used for
// one thing only — asking how bright the air is exactly where the cube stands,
// so the cube can answer a ray passing over it.
//
// The mirror and the GLSL in shaders.ts are a pair: the constants below are
// the ones the shader compiles in, and changing one without the other makes
// the cube answer a ray that is not there. So the mirror carries the whole
// chain the shader does — the parallax offset, the fbm warp, the band field
// and the transmission remap — rather than the field alone. Leaving the warp
// out looked harmless only because at the default light angle it happens to
// project to nothing on the across-axis; at other azimuths the same warp moves
// the reading most of a band over, and the parallax offset can carry it past a
// band's edge on its own.
import { rng } from './motion'

/** widths run from a narrow pleat to a broad one — about four to one */
const PLEAT_MIN_W = 0.16
const PLEAT_MAX_W = 0.5
/** brightness range across bands */
const PLEAT_MIN_AMP = 0.4
/** how deeply the shimmer modulates a band's brightness */
const PLEAT_SHIMMER_DEPTH = 0.25
/**
 * Neighbouring cells gathered at a point. The background compiles this into
 * the shader as the `PLEAT_SPAN` define, so the GLSL loop and the loop below
 * are bounded by one number rather than two that have to be kept equal.
 */
export const PLEAT_SPAN = 1
/** the field's ordinary level and a band core's: the shader's PLEAT_LOW/HIGH */
const PLEAT_LOW = 0.12
const PLEAT_HIGH = 0.7

/** the shader's 2D hash, for the warp */
function hash21(x: number, y: number): number {
  let px = x * 123.34
  let py = y * 456.21
  px -= Math.floor(px)
  py -= Math.floor(py)
  const d = px * (px + 45.32) + py * (py + 45.32)
  px += d
  py += d
  const v = px * py
  return v - Math.floor(v)
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash21(xi, yi)
  const b = hash21(xi + 1, yi)
  const c = hash21(xi, yi + 1)
  const d = hash21(xi + 1, yi + 1)
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy
}

/** the shader's fbm, same lattice rotation, same octave count */
function fbm(x: number, y: number, octaves: number): number {
  let v = 0
  let a = 0.5
  let px = x
  let py = y
  for (let i = 0; i < octaves; i++) {
    v += a * vnoise(px, py)
    const nx = 1.6 * px - 1.2 * py
    const ny = 1.2 * px + 1.6 * py
    px = nx
    py = ny
    a *= 0.5
  }
  return v
}

/** the shader's band hash, digit for digit, so both sides agree on every band */
function hash11(p: number): number {
  let x = p * 0.1031
  x = x - Math.floor(x)
  x *= x + 33.33
  x *= x + x
  return x - Math.floor(x)
}

/**
 * Everything the band field needs to be evaluated, so the CPU mirror and the
 * shader can never be given different shapes of the same field.
 */
export interface PleatField {
  /** bands per unit of the across-axis */
  bands: number
  /** the breeze's lateral offset, in band units */
  sway: number
  /** how much of a band's brightness travels along it */
  shimmer: number
  /** how many cycles of that travel fit along the axis toward the light */
  shimmerScale: number
  /** the shimmer's phase, which the gusts quicken */
  phase: number
  /** scales every band's width together */
  widthRatio: number
  /** how far a band may sit from its cell's centre, in cell widths */
  jitter: number
  /** how soft a band's edges are */
  soft: number
  /** the fraction of the beam that misses the curtain (the shader's uBase) */
  base: number
  /** the shader's warp: scale, amount, its time, and the octaves it runs at */
  warpScale: number
  warpAmount: number
  time: number
  octaves: number
  /** the screen-space axes of the one light, and the parallax offset applied to them */
  alongX: number
  alongY: number
  acrossX: number
  acrossY: number
  parX: number
  parY: number
}

/**
 * How much light the curtain lets through at one screen point, 0 where the
 * weave is closed and 1 at a band's core — the shader's whole chain mirrored,
 * from the parallax offset through the warp and the band field to the
 * transmission remap. Used for a single question: how bright is the air where
 * the cube stands.
 *
 * `x` and `y` are the point in the background's p-space, parallax-free (the
 * cube's silhouette is pinned to that space); the parallax the shader adds is
 * applied here.
 */
export function pleatAt(x: number, y: number, f: PleatField): number {
  const px = x + f.parX * 0.016
  const py = y + f.parY * 0.011
  const w = fbm(px * f.warpScale + f.time * 0.016, py * f.warpScale - f.time * 0.012, f.octaves)
  const qx = px + (w - 0.5) * f.warpAmount
  const qy = py + (w - 0.5) * f.warpAmount
  const across = qx * f.acrossX + qy * f.acrossY
  const along = qx * f.alongX + qy * f.alongY
  const u = across * f.bands + f.sway
  const soft = Math.max(0.15, f.soft)
  let sum = 0
  const i0 = Math.floor(u)
  for (let k = -PLEAT_SPAN; k <= PLEAT_SPAN; k++) {
    const ci = i0 + k
    const hw = hash11(ci)
    const hb = hash11(ci + 71.3)
    const hp = hash11(ci + 131.7)
    const centre = ci + 0.5 + (hp - 0.5) * f.jitter
    const w = (PLEAT_MIN_W + (PLEAT_MAX_W - PLEAT_MIN_W) * hw * hw) * f.widthRatio
    const d = (u - centre) / w
    const g = Math.exp((-d * d) / soft)
    const sh = Math.sin(along * f.shimmerScale - f.phase + hp * 6.283)
    const amp =
      (PLEAT_MIN_AMP + (1 - PLEAT_MIN_AMP) * hb) *
      (1 - f.shimmer * PLEAT_SHIMMER_DEPTH + f.shimmer * PLEAT_SHIMMER_DEPTH * sh)
    sum += g * amp
  }
  // the same remap the shader applies, so both sides agree on what a gap is
  const t = Math.min(1, Math.max(0, (sum - PLEAT_LOW) / (PLEAT_HIGH - PLEAT_LOW)))
  const pass = t * t * (3 - 2 * t)
  // and the same bypass: at base 1 the beam misses the curtain entirely and no
  // bands are drawn, so the cube must stop answering them
  const base = Math.min(1, Math.max(0, f.base))
  return pass + (1 - pass) * base
}

/**
 * A light breeze. The sway is two slow sines that never line up, so the set
 * drifts rather than swings; the gusts are a seeded sequence of swells, each
 * one raising the sway and quickening the shimmer before settling back. Rest
 * is not stillness — the air is always moving a little.
 */
export class Breeze {
  /** lateral offset of the whole ray set, in band units */
  sway = 0
  /** the shimmer's phase, advanced faster during a gust */
  phase = 0
  /** 0..1, how far into a swell the air is right now */
  gust = 0
  private t = 0
  private next: number
  private start = 0
  private length = 0
  private rand: () => number

  constructor(seed = 0x5eed) {
    this.rand = rng(seed)
    this.next = 4 + this.rand() * 6
  }

  /**
   * @param rate   gusts per minute, 0 for none
   * @param depth  how much a gust adds to the sway
   * @param speed  the shimmer's base rate
   * @param length a gust's length in seconds, jittered by a third either way
   */
  tick(dt: number, rate: number, depth: number, speed: number, length = 4) {
    this.t += dt
    if (rate > 0 && this.t >= this.next) {
      this.start = this.t
      this.length = length * (0.7 + this.rand() * 0.6)
      // the interval is the rate's period, jittered by half, so gusts never metronome
      const period = 60 / rate
      this.next = this.t + this.length + period * (0.5 + this.rand())
    }
    // `start` is only ever set to the current `t`, so `into` cannot be
    // negative; and before the first gust `length` is 0, which the same
    // comparison already rejects
    const into = this.t - this.start
    // in on a curve, out on a longer one: air arrives faster than it leaves
    this.gust = into < this.length ? Math.sin((Math.PI * into) / this.length) ** 1.5 : 0
    const g = this.gust * depth
    this.sway = (Math.sin(this.t * 0.11) * 0.6 + Math.sin(this.t * 0.071 + 1.7) * 0.4) * (1 + g * 2.2)
    this.phase += dt * speed * (1 + g * 1.6)
  }

  /** reduced motion: the air is there but it is not moving */
  settle() {
    this.gust = 0
    this.sway = 0
  }
}
