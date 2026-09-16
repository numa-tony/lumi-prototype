// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/cube/motion.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// Motion model for the Cube's states. Springs are tuned in Apple's terms
// (response in seconds, damping ratio: 1 settles without overshoot, below 1
// overshoots), a tiny deterministic sequencer gives the thinking loops a
// rhythm that never repeats exactly, and one driver per thinking option turns
// its internal state into a Pose. Every value is blended from wherever it is
// right now: entering, leaving and switching options mid-thought are all the
// same operation, a retarget.

export class Spring {
  x: number
  v = 0
  target: number
  private k = 1
  private c = 1
  constructor(x: number, response = 0.5, damping = 1) {
    this.x = x
    this.target = x
    this.tune(response, damping)
  }
  tune(response: number, damping: number) {
    const w = (2 * Math.PI) / Math.max(0.02, response)
    this.k = w * w
    this.c = 2 * damping * w
    return this
  }
  tick(dt: number) {
    // semi-implicit Euler, substepped so a stiff spring stays stable on a slow frame
    const w = Math.sqrt(this.k)
    const n = Math.max(1, Math.ceil((dt * w) / 0.35))
    const h = dt / n
    for (let i = 0; i < n; i++) {
      this.v += (this.k * (this.target - this.x) - this.c * this.v) * h
      this.x += this.v * h
    }
    return this.x
  }
  settle(x = this.target) {
    this.target = x
    this.x = x
    this.v = 0
    return this
  }
  /** A velocity kick sized so the spring peaks about `peak` above rest, then returns. */
  impulse(peak: number) {
    const w = Math.sqrt(this.k)
    const z = this.c / (2 * w)
    if (z >= 1) {
      this.v += peak * w * Math.E
      return
    }
    const s = Math.sqrt(1 - z * z)
    const th = Math.atan2(s, z)
    const g = Math.exp((-z * th) / s) * s
    this.v += (peak * w * s) / g
  }
}

export class SpringVec {
  x: Spring
  y: Spring
  z: Spring
  constructor(response: number, damping: number) {
    this.x = new Spring(0, response, damping)
    this.y = new Spring(0, response, damping)
    this.z = new Spring(0, response, damping)
  }
  set(x: number, y: number, z: number) {
    this.x.target = x
    this.y.target = y
    this.z.target = z
  }
  settle(x = 0, y = 0, z = 0) {
    this.x.settle(x)
    this.y.settle(y)
    this.z.settle(z)
  }
  tick(dt: number) {
    this.x.tick(dt)
    this.y.tick(dt)
    this.z.tick(dt)
  }
}

/** mulberry32: a small seeded generator so a loop's rhythm is irregular but repeatable */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Everything a state can change about the cube, as plain numbers, so states
 * blend by weight. Multipliers are 1 at idle; offsets are 0.
 */
export interface Pose {
  /** rig */
  lift: number
  pitch: number
  roll: number
  yawAdjust: number
  spinRate: number
  floatAmp: number
  /** interior light */
  breathPeriod: number
  breathAmp: number
  bodyHalf: number
  bodyGain: number
  accent: number
  /** the light pooling toward the low side, 0..1 (direction is computed from the rig) */
  slosh: number
  /** the diffuse body's own offset, object space */
  bx: number
  by: number
  bz: number
  /** the condensed kernel: weight, size (× the core half) and object-space position */
  kernel: number
  kernelHalf: number
  kx: number
  ky: number
  kz: number
  /** spectral split of the interior, 0..1, and its direction */
  disperse: number
  dispAngle: number
  /** glass */
  chromatic: number
  prism: number
  edgeGain: number
  sweepPeriod: number
  /** width of the travelling specular band (object units²; small = a spectral line) */
  sweepWidth: number
  /** floor */
  causticGain: number
  causticSpeed: number
  causticShift: number
  causticSharp: number
  causticFollow: number
  shadowSoft: number
  /**
   * the air behind the cube. Multipliers on the background's rays, on how far
   * the breeze swings them and on how fast they shimmer, so a state can quiet
   * or quicken the light it sits in. Every state today leaves them at 1; they
   * are wired now so the shader never has to be opened again to let one move.
   */
  airRays: number
  airBreeze: number
  airShimmer: number
}

export const POSE_KEYS = [
  'lift', 'pitch', 'roll', 'yawAdjust', 'spinRate', 'floatAmp',
  'breathPeriod', 'breathAmp', 'bodyHalf', 'bodyGain', 'accent', 'slosh', 'bx', 'by', 'bz',
  'kernel', 'kernelHalf', 'kx', 'ky', 'kz', 'disperse', 'dispAngle',
  'chromatic', 'prism', 'edgeGain', 'sweepPeriod', 'sweepWidth',
  'causticGain', 'causticSpeed', 'causticShift', 'causticSharp', 'causticFollow', 'shadowSoft',
  'airRays', 'airBreeze', 'airShimmer',
] as const satisfies readonly (keyof Pose)[]

export function makePose(): Pose {
  return {
    lift: 0, pitch: 0, roll: 0, yawAdjust: 0, spinRate: 0.1, floatAmp: 0.04,
    breathPeriod: 7, breathAmp: 0.1, bodyHalf: 1, bodyGain: 1, accent: 0.35, slosh: 0, bx: 0, by: 0, bz: 0,
    kernel: 0, kernelHalf: 0.42, kx: 0, ky: 0, kz: 0, disperse: 0, dispAngle: 0,
    chromatic: 0.06, prism: 0.7, edgeGain: 1, sweepPeriod: 8, sweepWidth: 0.12,
    causticGain: 1, causticSpeed: 1, causticShift: 0.07, causticSharp: 0, causticFollow: 0, shadowSoft: 0,
    airRays: 1, airBreeze: 1, airShimmer: 1,
  }
}

export function copyPose(to: Pose, from: Pose) {
  for (const k of POSE_KEYS) to[k] = from[k]
}

/** out = Σ w_i · pose_i. Weights are normalised by the caller. */
export function blendPoses(out: Pose, parts: { pose: Pose; w: number }[]) {
  for (const k of POSE_KEYS) {
    let v = 0
    for (const p of parts) v += p.pose[k] * p.w
    out[k] = v
  }
}

export interface DriverCtx {
  dt: number
  /** true while this option is the live one (thinking, and chosen) */
  active: boolean
  reduced: boolean
}

export interface ThinkDriver {
  id: string
  /** the option just became live: start its sequence from rest */
  enter(): void
  /** advance the internal model (runs every frame, live or not, so a fade-out keeps moving) */
  tick(ctx: DriverCtx): void
  /** write the target pose for this option, starting from a copy of the idle pose */
  write(out: Pose): void
}

// ---------------------------------------------------------------------------
// Weigh: the body thinks. The cube tips into a considered pose, holds it,
// tips into another, the way a head tilts over a question. Every move is a
// decisive spring with a soft settle; the light inside lags behind it and
// pools toward the low corner, so the tilt has weight.
const WEIGH_POSES: [number, number][] = [
  [-0.09, 0.16],
  [-0.06, -0.15],
  [-0.12, 0.05],
  [-0.04, -0.09],
  [-0.1, 0.12],
  [-0.07, -0.13],
]

export class Weigh implements ThinkDriver {
  id = 'weigh'
  private pitch = new Spring(0, 0.8, 0.7)
  private roll = new Spring(0, 0.95, 0.7)
  private slosh = new Spring(0, 1.1, 0.75)
  private random = rng(7)
  private seed = 7
  private t = 0
  private next = 0
  private i = 0
  enter() {
    this.seed += 1
    this.random = rng(this.seed)
    this.t = 0
    this.next = 0
    this.i = Math.floor(this.random() * WEIGH_POSES.length)
  }
  tick({ dt, active, reduced }: DriverCtx) {
    this.t += dt
    if (active && !reduced) {
      if (this.t >= this.next) {
        const [p, r] = WEIGH_POSES[this.i % WEIGH_POSES.length]
        const j = 0.85 + this.random() * 0.3
        this.pitch.target = p * j
        this.roll.target = r * (0.85 + this.random() * 0.3)
        this.i += 1
        this.next = this.t + 1.1 + this.random() * 0.8
      }
    } else {
      this.pitch.target = 0
      this.roll.target = 0
    }
    this.pitch.tick(dt)
    this.roll.tick(dt)
    this.slosh.target = Math.min(1, Math.hypot(this.pitch.x, this.roll.x) * 5.5)
    this.slosh.tick(dt)
  }
  write(o: Pose) {
    o.pitch = this.pitch.x
    o.roll = this.roll.x
    o.slosh = this.slosh.x
    o.lift = 0.1
    o.spinRate = 0
    o.floatAmp = 0
    o.breathPeriod = 5
    o.breathAmp = 0.06
    o.bodyGain = 1.05
    o.sweepPeriod = 5
    o.causticGain = 1.15
    o.causticSpeed = 1.2
    o.causticFollow = 1
    o.shadowSoft = 1
    o.edgeGain = 1.1
  }
}

// ---------------------------------------------------------------------------
// Gather: the light thinks. The diffuse glow condenses into one small bright
// kernel, city-coloured at the heart, which then travels the interior in
// deliberate glides with pauses, the way a thought looks for its shape. The
// diffuse body follows it with a lag, a tail without particles.
const ANCHORS: [number, number, number][] = [
  [0.26, 0.18, 0.2],
  [-0.24, 0.14, -0.22],
  [0.22, -0.16, -0.2],
  [-0.26, -0.12, 0.22],
  [0.0, 0.24, -0.1],
  [0.24, 0.02, -0.26],
  [-0.22, 0.2, 0.18],
  [0.06, -0.22, 0.24],
  [-0.2, -0.06, -0.18],
]

export class Gather implements ThinkDriver {
  id = 'gather'
  private k = new SpringVec(1.2, 0.78)
  private b = new SpringVec(2.0, 1)
  private random = rng(3)
  private seed = 3
  private t = 0
  private next = 0
  private at = -1
  enter() {
    this.seed += 1
    this.random = rng(this.seed)
    this.t = 0
    this.next = 0.55 // condense first, then start looking
    this.at = -1
    this.k.settle()
    this.b.settle()
  }
  tick({ dt, active, reduced }: DriverCtx) {
    this.t += dt
    if (active && !reduced) {
      if (this.t >= this.next) {
        const cur = this.at >= 0 ? ANCHORS[this.at] : [0, 0, 0]
        const far = ANCHORS.map((a, i) => ({ a, i })).filter(({ a, i }) => i !== this.at && Math.hypot(a[0] - cur[0], a[1] - cur[1], a[2] - cur[2]) > 0.32)
        const pick = far[Math.floor(this.random() * far.length)]
        this.at = pick.i
        this.k.set(...pick.a)
        this.next = this.t + 0.9 + this.random() * 0.7
      }
    } else {
      this.k.set(0, 0, 0)
    }
    this.k.tick(dt)
    this.b.set(this.k.x.x, this.k.y.x, this.k.z.x)
    this.b.tick(dt)
  }
  write(o: Pose) {
    const t = this.t
    o.kernel = 1
    o.kernelHalf = 0.5
    o.kx = this.k.x.x + 0.02 * Math.sin(t * 1.3)
    o.ky = this.k.y.x + 0.015 * Math.sin(t * 1.7 + 1)
    o.kz = this.k.z.x + 0.02 * Math.sin(t * 0.9 + 2)
    o.bx = this.b.x.x * 0.6
    o.by = this.b.y.x * 0.6
    o.bz = this.b.z.x * 0.6
    o.bodyHalf = 0.95
    o.bodyGain = 1
    o.accent = 0.5
    o.pitch = 0.05
    o.lift = 0.03
    o.spinRate = 0
    o.floatAmp = 0.015
    o.breathPeriod = 4.2
    o.breathAmp = 0.05
    o.sweepPeriod = 6
    o.prism = 0.8
    o.edgeGain = 1.1
    o.causticGain = 1.3
    o.causticSpeed = 1.5
    o.causticShift = 0.09
    o.causticSharp = 0.5
    o.causticFollow = 0.85
    o.shadowSoft = 0.2
  }
}

// ---------------------------------------------------------------------------
// Prism: the material thinks. The glass disperses its light into a spectrum
// that breathes: spreads, gathers back toward white, spreads again. At each
// gather the cube adjusts its angle a few degrees, a prism being turned
// until the colours resolve. The floor becomes a spectral pool.
export class Prism implements ThinkDriver {
  id = 'prism'
  private yaw = new Spring(0, 0.9, 0.7)
  private random = rng(11)
  private seed = 11
  private t = 0
  private phase = 0
  private beat = 0
  private side = 1
  private split = 0
  enter() {
    this.seed += 1
    this.random = rng(this.seed)
    this.t = 0
    this.phase = 0
    this.beat = 0
    this.split = 0
  }
  tick({ dt, active, reduced }: DriverCtx) {
    this.t += dt
    if (active) {
      if (reduced) this.split += (0.6 - this.split) * (1 - Math.pow(0.5, dt / 0.4))
      else {
        this.phase += (dt * Math.PI * 2) / 3.2
        const s = 0.5 - 0.5 * Math.cos(this.phase)
        this.split = s * s * (3 - 2 * s)
        const beat = Math.floor(this.phase / (Math.PI * 2))
        if (beat !== this.beat) {
          this.beat = beat
          this.side = -this.side
          this.yaw.target = this.side * (0.05 + this.random() * 0.05)
        }
      }
    } else {
      this.yaw.target = 0
      this.split += (0 - this.split) * (1 - Math.pow(0.5, dt / 0.25))
    }
    this.yaw.tick(dt)
  }
  write(o: Pose) {
    const d = 0.25 + 0.75 * this.split
    o.disperse = d
    o.dispAngle = this.t * 0.45 + 0.8
    o.chromatic = 0.07 + 0.28 * d
    o.yawAdjust = this.yaw.x
    o.pitch = -0.05
    o.lift = 0.05
    o.spinRate = 0.035
    o.floatAmp = 0.02
    o.breathPeriod = 5
    o.breathAmp = 0.06
    o.bodyGain = 1.1
    o.accent = 0.45
    o.sweepPeriod = 3.4
    o.sweepWidth = 0.045
    o.prism = 0.85
    o.edgeGain = 1.2
    o.causticGain = 1.45
    o.causticSpeed = 1.6
    o.causticShift = 0.07 + 0.09 * d
    o.causticSharp = 0.35
    o.shadowSoft = 0.3
  }
}
