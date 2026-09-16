// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/cube/index.tsx @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// Direction one — Cube. See docs/direction-cube.md and docs/states-thinking.md.
// A sharp glass cube with a breathing light inside, on Numa's warm canvas,
// with a prismatic light leak behind it and rainbow caustics beneath it.
// States (phase 2) reshape the same object: nothing is swapped in, every
// value springs from wherever it is to where the state wants it.
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { DialConfig } from 'dialkit'
import type { Direction, DirectionProps, EntityStateId, StateOption, Tweaks } from '../types'
import { NUMA_CANVAS, NUMA_PINK } from '../../lib/cities'
import { dialDefaults, dialPanelId, num, useDialValue } from '../../lib/dials'
import {
  BACKGROUND_FRAG,
  CAUSTIC_FRAG,
  CORE_FRAG,
  CORE_VERT,
  DOME_FRAG,
  DOME_VERT,
  FULLSCREEN_VERT,
  STREAK_INJECT,
} from './shaders'
import { Gather, Prism, Spring, Weigh, blendPoses, copyPose, makePose, type Pose, type ThinkDriver } from './motion'
import { LIGHT_AZIMUTH, LIGHT_ELEVATION, aimedLight, setFloorThrow, setLightDir, setScreenAxes, studioRig } from './light'
import { Breeze, PLEAT_SPAN, pleatAt, type PleatField } from './air'
import { bakeWall } from './wall'

const PANEL = dialPanelId('cube')

/**
 * The cube's dials, and the single source of truth for their defaults.
 *
 * These numbers are a tuned look, not first guesses: they came back from the
 * panel's Copy button after a session on the deployed site. Everything that
 * needs a default reads it from here through `dial()`, so a value lives in one
 * place — the three-way drift between a schema entry, a frame-loop fallback
 * and a uniform's initial value is not a mistake worth being able to make.
 *
 * Folders are one idea each, and Advanced is collapsed because those are the
 * parameters you only reach for when a macro cannot get where you want.
 */
const DIALS = {
  light: {
    azimuth: [LIGHT_AZIMUTH, -180, 180, 1],
    elevation: [LIGHT_ELEVATION, 10, 80, 1],
    warmth: [0.58, 0, 1, 0.01],
    aim: [8.5, 0, 20, 0.5],
  },
  rays: {
    strength: [0.7, 0, 2, 0.05],
    bands: [9.5, 2, 26, 0.5],
    softness: [2.2, 0.2, 3, 0.05],
    reach: [1.65, 0.3, 2.5, 0.05],
    spectral: [1.3, 0, 2, 0.05],
    shade: [1.25, 0, 3, 0.05],
    base: [0.25, 0, 1, 0.05],
  },
  breeze: {
    sway: [0.25, 0, 3, 0.05],
    tempo: [0.8, 0, 3, 0.05],
    // tuned to what used to be the ceiling, so the ceiling moves up: a default
    // sitting on its own maximum is a dial you can only turn one way
    shimmer: [2, 0, 3, 0.05],
    gusts: [7.5, 0, 12, 0.5],
    gustStrength: [1.45, 0, 3, 0.05],
  },
  wall: {
    relief: [1.15, 0, 2, 0.05],
    bite: [0.1, 0, 1, 0.05],
    fan: [1, 0, 2, 0.05],
  },
  cube: {
    breath: [1.15, 0, 2.5, 0.05],
    rotation: [0.17, 0, 0.6, 0.01],
    glow: [1.65, 0, 2.5, 0.05],
    refraction: [0.115, 0, 0.3, 0.005],
    thickness: [0.8, 0.1, 1.6, 0.05],
    sweepPeriod: [8, 3, 20, 0.5],
    accent: [0.35, 0, 1, 0.05],
  },
  floor: {
    caustic: [0.7, 0, 4, 0.05],
  },
  post: {
    bloom: [0, 0, 1, 0.01],
  },
  advanced: {
    _collapsed: true,
    spread: [0.95, 0.2, 2, 0.05],
    widthRatio: [1, 0.3, 2.5, 0.05],
    jitter: [0.55, 0, 1, 0.01],
    shimmerScale: [2.7, 0.5, 8, 0.1],
    warpScale: [1.1, 0.2, 4, 0.05],
    warpAmount: [0.22, 0, 0.8, 0.01],
    gustLength: [4, 1, 12, 0.5],
    seam: [1, 0, 2, 0.05],
    fanSpread: [1, 0.2, 3, 0.05],
    reliefScale: [5.5, 1, 20, 0.5],
    shadowSoft: [0, 0, 1, 0.05],
    vignette: [1, 0, 3, 0.05],
    // the brand rule is that the city colour is never more than a 6% accent,
    // so the dial's range is downward only
    corner: [0.06, 0, 0.06, 0.005],
  },
} satisfies DialConfig

const DIAL_DEFAULT = dialDefaults(DIALS)

/** Read a live dial, defaulting to whatever DIALS declares for it. */
const dial = (t: Tweaks, path: string) => num(t, path, DIAL_DEFAULT[path] as number)

/** The declared default for a dial React itself owns, rather than the frame loop. */
const dialDef = (path: string) => DIAL_DEFAULT[path] as number

const SIZE = 1.35
const BEVEL = 0.05
const BG_Z = -30
const TILT = (12 * Math.PI) / 180
/** rest yaw: a corner toward the viewer, the way the slide shows it */
const REST_YAW = 0.55
/** half-size of the inner light volume */
const CORE_HALF = SIZE * 0.46
/** how strongly the interior light is drawn into the refraction buffer (the ghost pair in the faces) */
const CORE_ECHO = 0.35

/**
 * The cube's silhouette on screen, in the background shader's p-space, written
 * by the entity each frame and read by the background so the beam can be
 * occluded behind it. r3f runs the background's useFrame first, so the shadow
 * trails the cube by one frame; at 60 fps that is invisible, and the cube's
 * screen position barely moves anyway.
 */
const SILHOUETTE = { x: 0, y: 0, r: 0, yaw: 0 }

/**
 * What the background and the entity have to tell each other about the air.
 *
 * Both directions travel through this one holder, and both are a frame apart:
 * r3f runs the background's useFrame before the entity's, so the entity reads
 * this frame's air and the background reads last frame's pose. At sixty frames
 * a second neither lag is visible, and the pose fields are identical across
 * every state that exists today.
 *
 * Background → entity: `atCube` is how bright the ray field is exactly where
 * the cube stands, so a ray passing over the cube brightens its bevel and
 * sweep — the cube answering the light rather than ignoring it. And `aim`, the
 * damped parallax the light is aimed by: the entity used to aim from the raw
 * pointer while the background aimed from this damped one, so while the hand
 * was moving the beams and the bevel disagreed about where the light was —
 * the exact disagreement light.ts exists to prevent.
 *
 * Entity → background: the pose's air multipliers, so a later state can quiet
 * or quicken the air without the background knowing what a state is.
 */
const AIR = { atCube: 0.5, rays: 1, breeze: 1, shimmer: 1, aimX: 0, aimY: 0 }

/** The three candidate designs for the thinking state. One will be chosen. */
const THINKING_OPTIONS: StateOption[] = [
  { id: 'weigh', name: 'Weigh', oneLiner: 'tilts over the question; the light pools like liquid' },
  { id: 'gather', name: 'Gather', oneLiner: 'the light condenses into one thought and goes looking' },
  { id: 'prism', name: 'Prism', oneLiner: 'the glass splits its light, turning until the colours resolve' },
]

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const backOut = (x: number, s = 1.55) => {
  const t = x - 1
  return 1 + t * t * ((s + 1) * t + s)
}
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
/** frame-rate independent exponential approach */
const damp = (cur: number, target: number, halfLife: number, dt: number) =>
  cur + (target - cur) * (1 - Math.pow(0.5, dt / halfLife))

/**
 * Materials are built imperatively and handed to the mesh as `material={}`:
 * r3f copies a `uniforms` prop into the material's own uniform objects, so a
 * memoised uniforms object mutated in useFrame never reaches the GPU.
 */
function useShader(vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>, extra: Partial<THREE.ShaderMaterialParameters> = {}) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, ...extra }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

/**
 * Hang the live objects off `window` under `name` so a headless run can read
 * them (`scripts/shot.mjs --eval`). Dev only, and cleaned up on unmount, so
 * nothing here survives into a build.
 */
function useDevHandle(name: string, value: () => unknown, deps: unknown[]) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    const w = window as unknown as Record<string, unknown>
    w[name] = value()
    return () => {
      delete w[name]
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ...deps])
}

// ---------------------------------------------------------------------------
// Background: one plane far behind everything, sized to the frustum every frame.
function Background({ inputs, city, reducedMotion, quality }: DirectionProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const L = useMemo(() => new THREE.Vector3(), [])
  const breeze = useMemo(() => new Breeze(), [])
  const low = quality === 'low'
  const field = useMemo<PleatField>(
    () => ({
      bands: dialDef('rays.bands'),
      sway: 0,
      shimmer: dialDef('breeze.shimmer'),
      shimmerScale: dialDef('advanced.shimmerScale'),
      phase: 0,
      widthRatio: dialDef('advanced.widthRatio'),
      jitter: dialDef('advanced.jitter'),
      soft: dialDef('rays.softness'),
      base: dialDef('rays.base'),
      warpScale: dialDef('advanced.warpScale'),
      warpAmount: dialDef('advanced.warpAmount'),
      time: 0,
      octaves: low ? 3 : 4,
      alongX: 0.7071, alongY: 0.7071, acrossX: 0.7071, acrossY: -0.7071, parX: 0, parY: 0,
    }),
    [low],
  )
  const wall = useMemo(() => bakeWall(low ? 128 : 256), [low])
  useEffect(() => () => wall.dispose(), [wall])
  const mat = useShader(
    FULLSCREEN_VERT,
    BACKGROUND_FRAG,
    {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uAspect: { value: 1 },
      uRay: { value: dialDef('rays.strength') },
      uBase: { value: dialDef('rays.base') },
      uBands: { value: dialDef('rays.bands') },
      uSoft: { value: dialDef('rays.softness') },
      uReach: { value: dialDef('rays.reach') },
      uSpectral: { value: dialDef('rays.spectral') },
      uShade: { value: dialDef('rays.shade') },
      uSpread: { value: dialDef('advanced.spread') },
      uWarm: { value: dialDef('light.warmth') },
      uAccent: { value: dialDef('cube.accent') },
      uParallax: { value: new THREE.Vector2() },
      uAlong: { value: new THREE.Vector2(0.7071, 0.7071) },
      uAcross: { value: new THREE.Vector2(0.7071, -0.7071) },
      uSway: { value: 0 },
      uShimmer: { value: dialDef('breeze.shimmer') },
      uShimmerT: { value: 0 },
      uWidthRatio: { value: dialDef('advanced.widthRatio') },
      uJitter: { value: dialDef('advanced.jitter') },
      uShimmerScale: { value: dialDef('advanced.shimmerScale') },
      uWarpScale: { value: dialDef('advanced.warpScale') },
      uWarpAmt: { value: dialDef('advanced.warpAmount') },
      uCube: { value: new THREE.Vector2() },
      uCubeR: { value: 0 },
      uBite: { value: dialDef('wall.bite') },
      uFan: { value: dialDef('wall.fan') },
      uFanTurn: { value: 0 },
      uFanSpread: { value: dialDef('advanced.fanSpread') },
      uRelief: { value: dialDef('wall.relief') },
      uReliefScale: { value: dialDef('advanced.reliefScale') },
      uSeam: { value: dialDef('advanced.seam') },
      uVignette: { value: dialDef('advanced.vignette') },
      uCorner: { value: dialDef('advanced.corner') },
      uWall: { value: wall },
      uCanvas: { value: new THREE.Color(NUMA_CANVAS) },
      uPink: { value: new THREE.Color(NUMA_PINK) },
      uCity: { value: new THREE.Color(city.hex) },
    },
    {
      depthWrite: false,
      depthTest: false,
      // the phone drops a noise octave; the band field is the same on both, so
      // the picture does not change shape between devices
      defines: { FBM_OCTAVES: low ? 3 : 4, PLEAT_SPAN },
    },
  )
  // dev only: the live background, for headless inspection
  useDevHandle('__bg', () => ({ mat, breeze, field, AIR }), [mat, breeze, field])

  useFrame((state, dtRaw) => {
    const m = mesh.current
    if (!m) return
    const D = inputs.dials.current
    const u = mat.uniforms
    const dt = Math.min(dtRaw, 1 / 20)
    const v = state.viewport.getCurrentViewport(state.camera, [0, 0, BG_Z])
    m.scale.set(v.width * 1.25, v.height * 1.25, 1)
    u.uAspect.value = v.width / v.height
    u.uTime.value += dt * (reducedMotion ? 0 : 1)
    u.uReveal.value = inputs.reveal.current

    // parallax first: the light is aimed by it, and everything downstream of
    // the light wants this frame's value, not last frame's
    const pIn = inputs.parallax.current
    const par = u.uParallax.value as THREE.Vector2
    if (reducedMotion) par.set(0, 0)
    else {
      par.x = damp(par.x, pIn.x, 0.12, dt)
      par.y = damp(par.y, pIn.y, 0.12, dt)
    }

    // the one light, nudged by the hand
    aimedLight(
      L,
      dial(D, 'light.azimuth'),
      dial(D, 'light.elevation'),
      reducedMotion ? 0 : dial(D, 'light.aim'),
      par.x,
      par.y,
    )
    const along = u.uAlong.value as THREE.Vector2
    const across = u.uAcross.value as THREE.Vector2
    setScreenAxes(state.camera, L, along, across)

    // --- the breeze ---------------------------------------------------------
    const swayAmt = dial(D, 'breeze.sway') * AIR.breeze
    if (reducedMotion) breeze.settle()
    else {
      breeze.tick(
        dt,
        dial(D, 'breeze.gusts'),
        dial(D, 'breeze.gustStrength'),
        0.85 * dial(D, 'breeze.tempo'),
        dial(D, 'advanced.gustLength'),
      )
    }
    // one description of the band field, handed to the shader and to the CPU
    // mirror, so the cube can never answer a ray the background did not draw
    field.bands = dial(D, 'rays.bands')
    field.sway = breeze.sway * swayAmt * 0.45
    field.shimmer = reducedMotion ? 0 : dial(D, 'breeze.shimmer') * AIR.shimmer
    field.shimmerScale = dial(D, 'advanced.shimmerScale')
    field.phase = breeze.phase
    field.widthRatio = dial(D, 'advanced.widthRatio')
    field.jitter = dial(D, 'advanced.jitter')
    field.soft = dial(D, 'rays.softness')
    field.base = dial(D, 'rays.base')
    field.warpScale = dial(D, 'advanced.warpScale')
    field.warpAmount = dial(D, 'advanced.warpAmount')
    field.time = u.uTime.value as number
    field.alongX = along.x
    field.alongY = along.y
    field.acrossX = across.x
    field.acrossY = across.y
    field.parX = par.x
    field.parY = par.y
    u.uSway.value = field.sway
    u.uShimmerT.value = field.phase
    u.uShimmer.value = field.shimmer
    u.uBands.value = field.bands
    u.uWidthRatio.value = field.widthRatio

    u.uRay.value = dial(D, 'rays.strength') * AIR.rays
    u.uBase.value = field.base
    u.uSoft.value = field.soft
    u.uReach.value = dial(D, 'rays.reach')
    u.uSpectral.value = dial(D, 'rays.spectral')
    u.uShade.value = dial(D, 'rays.shade')
    u.uSpread.value = dial(D, 'advanced.spread')
    u.uWarm.value = dial(D, 'light.warmth')
    u.uAccent.value = dial(D, 'cube.accent')
    ;(u.uCity.value as THREE.Color).set(city.hex)

    u.uBite.value = dial(D, 'wall.bite')
    u.uRelief.value = dial(D, 'wall.relief')
    u.uFan.value = dial(D, 'wall.fan')
    u.uFanTurn.value = SILHOUETTE.yaw
    ;(u.uCube.value as THREE.Vector2).set(SILHOUETTE.x, SILHOUETTE.y)
    u.uCubeR.value = SILHOUETTE.r

    u.uJitter.value = field.jitter
    u.uShimmerScale.value = field.shimmerScale
    u.uWarpScale.value = field.warpScale
    u.uWarpAmt.value = field.warpAmount
    u.uFanSpread.value = dial(D, 'advanced.fanSpread')
    u.uReliefScale.value = dial(D, 'advanced.reliefScale')
    u.uSeam.value = dial(D, 'advanced.seam')
    u.uVignette.value = dial(D, 'advanced.vignette')
    u.uCorner.value = dial(D, 'advanced.corner')

    // Hand the entity the air where it stands. This is the shader's own band
    // field evaluated on the CPU (air.ts), not a guess: when a ray passes over
    // the cube the cube brightens with it.
    AIR.atCube = pleatAt(SILHOUETTE.x, SILHOUETTE.y, field)
    AIR.aimX = par.x
    AIR.aimY = par.y
  })
  return (
    <mesh ref={mesh} position={[0, 0, BG_Z]} frustumCulled={false} renderOrder={-10} material={mat}>
      <planeGeometry />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
/**
 * A single low bloom, off by default.
 *
 * Measured, it does very little here, and the reason is the same twelve levels
 * of headroom everything else on this canvas runs into: bloom needs something
 * meaningfully brighter than its surroundings to bloom, and on an off-white
 * wall nothing is. Sweeping the dial from 0 to 1 moves the cube's mean by
 * about 0.03 of a level and the wall's median by about 0.4, most of that being
 * the composer mounting rather than the bloom itself. Lowering the threshold
 * from above-white to just-above-canvas did not change that.
 *
 * It is kept because it was asked for and because it costs nothing while the
 * dial is at 0 — the composer does not mount at all. Turning it up has two
 * costs worth knowing: an EffectComposer renders into its own target, where
 * three treats the working colour space as final, which halves the effective
 * dither on a picture whose whole range is about eight levels; and the cube's
 * materials bypass the renderer's NeutralToneMapping, which is harmless only
 * while every one of them is a raw ShaderMaterial or toneMapped={false}.
 */
function Effects({ reducedMotion, quality }: DirectionProps) {
  const intensity = useDialValue(PANEL, 'post.bloom', dialDef('post.bloom'))
  if (reducedMotion || intensity <= 0.001) return null
  const low = quality === 'low'
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={intensity}
        // just above the canvas rather than above white, so that what little
        // the pass can do lands on the cube's specular and the ray cores
        luminanceThreshold={0.96}
        luminanceSmoothing={0.25}
        radius={0.4}
        levels={low ? 3 : 4}
        resolutionScale={low ? 0.25 : 0.5}
      />
    </EffectComposer>
  )
}

// ---------------------------------------------------------------------------
// Procedural studio: a gradient dome, two pastel panels, a top softbox and a
// thin bright strip. The moving specular sweep is analytic (see STREAK_INJECT)
// so the cubemap renders once.
function Studio({ quality, azimuth, elevation }: { quality: 'high' | 'low'; azimuth: number; elevation: number }) {
  const rig = useMemo(() => studioRig(setLightDir(new THREE.Vector3(), azimuth, elevation)), [azimuth, elevation])
  const dome = useShader(
    DOME_VERT,
    DOME_FRAG,
    {
      uTop: { value: new THREE.Color('#ffffff').multiplyScalar(1.25) },
      uHorizon: { value: new THREE.Color('#efdadf') },
      uFloor: { value: new THREE.Color('#5d5256') },
      uBand: { value: new THREE.Color('#8a7680') },
    },
    { side: THREE.BackSide },
  )
  return (
    <Environment key={`${azimuth}:${elevation}`} resolution={quality === 'low' ? 128 : 256} frames={1}>
      <mesh scale={40} material={dome}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      <Lightformer form="rect" color="#fff6f2" intensity={2.2} scale={[9, 9]} position={rig.top} />
      {/* warm on the light's side, cool filling from the opposite one */}
      <Lightformer form="rect" color={NUMA_PINK} intensity={3} scale={[5, 7]} position={rig.warm} />
      <Lightformer form="rect" color="#d8c9ff" intensity={2.5} scale={[5, 7]} position={rig.cool} />
      <Lightformer form="rect" color="#ffe9ee" intensity={0.9} scale={[6, 3]} position={[0, -1, -7]} />
      {/* behind the camera: bright above, a deeper mauve below, so every bevel reads as a line */}
      <Lightformer form="rect" color="#ffffff" intensity={1.6} scale={[14, 4]} position={[0, 4.5, 9]} />
      <Lightformer form="rect" color="#a4929c" intensity={0.55} scale={[14, 5]} position={[0, -3.2, 9]} />
      {/* the key strip: the source the travelling highlight is a reflection of */}
      <Lightformer form="rect" color="#ffffff" intensity={5} scale={[0.14, 5]} position={rig.key} />
    </Environment>
  )
}

// ---------------------------------------------------------------------------
// The entity.
interface Motion {
  sq: number // press squash (critically damped)
  sqv: number
  wob: number // tap jelly (underdamped)
  wobv: number
  lastTap: number
  flash: number
  breathPhase: number
  spin: number
  sweep: number
  /** last seen entity mode, to detect enter / exit / option switches */
  modeState: EntityStateId
  modeOption: string
  modeAt: number
}

type MTM = ComponentRef<typeof MeshTransmissionMaterial>

function Entity({ inputs, city, reducedMotion, quality }: DirectionProps) {
  const rig = useRef<THREE.Group>(null) // rotation + float + lift
  const squash = useRef<THREE.Group>(null) // non-uniform scale (press / jelly / exhale)
  const shell = useRef<THREE.Group>(null) // glass scale (entrance)
  const glass = useRef<THREE.Mesh>(null)
  const core = useRef<THREE.Mesh>(null)
  const floor = useRef<THREE.Mesh>(null)
  const glassMat = useRef<MTM>(null)
  const m = useRef<Motion>({
    sq: 0, sqv: 0, wob: 0, wobv: 0, lastTap: 0, flash: 0, breathPhase: 0, spin: 0, sweep: 0,
    modeState: 'idle', modeOption: '', modeAt: -1,
  })
  const low = quality === 'low'
  const samples = low ? 4 : 8
  // Three dials React owns rather than the frame loop: the light angles rebake
  // the studio's cubemap on change, and drei re-applies `thickness` from its
  // prop every frame, so a per-frame write to the material would be overwritten.
  // Everything else is read from the holder inside useFrame.
  const azDial = useDialValue(PANEL, 'light.azimuth', dialDef('light.azimuth'))
  const elDial = useDialValue(PANEL, 'light.elevation', dialDef('light.elevation'))
  const thicknessDial = useDialValue(PANEL, 'cube.thickness', dialDef('cube.thickness'))

  // --- state model: one driver per thinking option, one weight spring each ---
  const think = useMemo(() => {
    const drivers: ThinkDriver[] = [new Weigh(), new Gather(), new Prism()]
    const idle = makePose()
    const parts = [...drivers.map(() => ({ pose: makePose(), w: 0 })), { pose: idle, w: 1 }]
    return {
      drivers,
      amounts: drivers.map(() => new Spring(0, 0.9, 1)),
      idle,
      parts,
      pose: makePose(),
      /** "I heard you": a quick brightening on entering thinking */
      ack: new Spring(0, 0.45, 0.75),
      /** "here it comes": a bloom with a soft undershoot on leaving thinking */
      exhale: new Spring(0, 0.6, 0.55),
      downObj: new THREE.Vector3(),
      bodyPos: new THREE.Vector3(),
      kernelPos: new THREE.Vector3(),
      lightWorld: new THREE.Vector3(),
      dispDir: new THREE.Vector3(1, 0, 0),
      q: new THREE.Quaternion(),
      L: new THREE.Vector3(),
      worldPos: new THREE.Vector3(),
      worldScale: new THREE.Vector3(),
      ndc: new THREE.Vector3(),
      throw2: new THREE.Vector2(),
    }
  }, [])

  const geometry = useMemo(() => new RoundedBoxGeometry(SIZE, SIZE, SIZE, low ? 5 : 7, BEVEL), [low])
  useEffect(() => () => geometry.dispose(), [geometry])

  const coreMat = useShader(
    CORE_VERT,
    CORE_FRAG,
    {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uAlpha: { value: 0 },
      uAccent: { value: dialDef('cube.accent') },
      uHalf: { value: CORE_HALF },
      uCamObj: { value: new THREE.Vector3(0, 0, 11) },
      uPink: { value: new THREE.Color(NUMA_PINK) },
      uCity: { value: new THREE.Color(city.hex) },
      uBodyPos: { value: new THREE.Vector3() },
      uBodyHalf: { value: CORE_HALF },
      uKernelPos: { value: new THREE.Vector3() },
      uKernelHalf: { value: CORE_HALF * 0.42 },
      uKernel: { value: 0 },
      uDisperse: { value: 0 },
      uDispDir: { value: new THREE.Vector3(1, 0, 0) },
      uDispScale: { value: CORE_HALF * 0.32 },
      uEcho: { value: 1 },
    },
    { transparent: true, depthWrite: false, depthTest: false, defines: { CORE_STEPS: low ? 6 : 10 } },
  )
  // Full strength on screen, a faint echo inside the glass's refraction buffer.
  //
  // This used to ask the renderer whether a render target was bound, which was
  // true only of the buffer pass — until the bloom pass arrived. An
  // EffectComposer draws the scene into its own target too, so that test became
  // true for *both* passes and pinned the light to its 35% echo, quietly undoing
  // the fix HANDOFF tells you to keep. Ask about the thing that actually
  // distinguishes them instead: drei swaps the glass onto a discard material for
  // the duration of its buffer render, so during that pass the mesh is not
  // wearing the transmission material. (True while `backside` is off, which is
  // the default and which this cube does not set.)
  useEffect(() => {
    const c = core.current
    if (!c) return
    c.onBeforeRender = () => {
      const worn = glass.current?.material as unknown as MTM | undefined
      const inBuffer = worn != null && worn !== glassMat.current
      coreMat.uniforms.uEcho.value = inBuffer ? CORE_ECHO : 1
    }
    return () => { c.onBeforeRender = () => {} }
  }, [coreMat])
  const camObj = useMemo(() => new THREE.Vector3(), [])
  const causticMat = useShader(
    FULLSCREEN_VERT,
    CAUSTIC_FRAG,
    {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uIntensity: { value: 1 },
      uFlash: { value: 0 },
      uAccent: { value: dialDef('cube.accent') },
      uPink: { value: new THREE.Color(NUMA_PINK) },
      uCity: { value: new THREE.Color(city.hex) },
      uShadow: { value: new THREE.Color('#b59aa3') },
      uCenter: { value: new THREE.Vector2() },
      uShadowOff: { value: new THREE.Vector2() },
      uShift: { value: 0.07 },
      uSharp: { value: 0 },
      uShadowSoft: { value: 0 },
    },
    { transparent: true, depthWrite: false },
  )
  // The far edges, seen through the glass: hairlines just inside the shell.
  // On screen the glass covers them; the refraction buffer shows them. The
  // verticals are fainter because the nearest one is seen through two faces
  // and would otherwise double.
  const [wireH, wireV] = useMemo(() => {
    const h = SIZE / 2
    const ring = (y: number) => [-h, y, -h, h, y, -h, h, y, -h, h, y, h, h, y, h, -h, y, h, -h, y, h, -h, y, -h]
    const horiz = new THREE.BufferGeometry()
    horiz.setAttribute('position', new THREE.Float32BufferAttribute([...ring(h), ...ring(-h)], 3))
    const vert = new THREE.BufferGeometry()
    vert.setAttribute('position', new THREE.Float32BufferAttribute([-h, -h, -h, -h, h, -h, h, -h, -h, h, h, -h, h, -h, h, h, h, h, -h, -h, h, -h, h, h], 3))
    return [horiz, vert]
  }, [])
  const wireMatH = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#c4b0ba', transparent: true, opacity: 0.3, toneMapped: false, depthWrite: false }),
    [],
  )
  const wireMatV = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#c4b0ba', transparent: true, opacity: 0.14, toneMapped: false, depthWrite: false }),
    [],
  )
  useEffect(() => () => { wireH.dispose(); wireV.dispose(); wireMatH.dispose(); wireMatV.dispose() }, [wireH, wireV, wireMatH, wireMatV])

  // The specular sweep: a thin strip light evaluated on the reflection vector
  // inside the transmission material, so the environment never re-renders.
  const streakU = useMemo(
    () => ({
      uStreakN: { value: new THREE.Vector3(0, 0, 1) },
      uStreakD: { value: new THREE.Vector3(1, 0, 0) },
      uStreakColor: { value: new THREE.Color('#ffffff').multiplyScalar(1.6) },
      uStreakWidth: { value: 0.3 },
      uSweepAxis: { value: new THREE.Vector3(1, 0, 0) },
      uSweepPhase: { value: -2 },
      uInvModel: { value: new THREE.Matrix4() },
      uEdgeColor: { value: new THREE.Color('#ffffff') },
      uEdgeGain: { value: 0.6 },
      uPrism: { value: 0.7 },
      uSweepWidth: { value: 0.12 },
      uCubeCenter: { value: new THREE.Vector3() },
      uLightDir: { value: new THREE.Vector3(0, 1, 0) },
    }),
    [],
  )
  useLayoutEffect(() => {
    const mat = glassMat.current as unknown as THREE.MeshPhysicalMaterial | null
    if (!mat) return
    const prev = mat.onBeforeCompile
    mat.onBeforeCompile = (shader, renderer) => {
      prev.call(mat, shader, renderer)
      Object.assign(shader.uniforms, streakU)
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec3 uStreakN; uniform vec3 uStreakD; uniform vec3 uStreakColor; uniform float uStreakWidth; uniform vec3 uSweepAxis; uniform float uSweepPhase; uniform mat4 uInvModel; uniform vec3 uEdgeColor; uniform float uEdgeGain; uniform float uPrism; uniform float uSweepWidth; uniform vec3 uCubeCenter; uniform vec3 uLightDir;\nvoid main() {')
        .replace('#include <opaque_fragment>', STREAK_INJECT + '\n#include <opaque_fragment>')
    }
    mat.customProgramCacheKey = () => `cube-streak-light-${samples}`
    mat.needsUpdate = true
  }, [streakU, samples])

  const edgeColor = useMemo(() => new THREE.Color('#ffffff').lerp(new THREE.Color(city.hex), 0.55).multiplyScalar(1.3), [city.hex])

  // dev only: the live model, for headless inspection
  useDevHandle('__cube', () => ({ think, coreMat, causticMat, streakU, glass, rig, core }), [
    think,
    coreMat,
    causticMat,
    streakU,
  ])

  useFrame((state, dtRaw) => {
    const s = m.current
    const D = inputs.dials.current
    const dt = Math.min(dtRaw, 1 / 30)
    const t = state.clock.elapsedTime
    const d = inputs.drag.current
    const p = inputs.parallax.current
    const r = inputs.reveal.current
    const accent = dial(D, 'cube.accent')
    const glow = dial(D, 'cube.glow')
    const breath = dial(D, 'cube.breath')
    const rayStrength = dial(D, 'rays.strength')
    const rotRate = reducedMotion ? Math.min(0.03, dial(D, 'cube.rotation')) : dial(D, 'cube.rotation')
    // the same aimed light the background uses, from the same two dials and
    // the same parallax, so the hand moves one light and not two
    aimedLight(
      think.L,
      dial(D, 'light.azimuth'),
      dial(D, 'light.elevation'),
      reducedMotion ? 0 : dial(D, 'light.aim'),
      AIR.aimX,
      AIR.aimY,
    )

    // --- state: enter / exit / option switch --------------------------------
    const mode = inputs.mode.current
    const T = think
    if (mode.at !== s.modeAt || mode.state !== s.modeState || mode.option !== s.modeOption) {
      const was = s.modeState === 'thinking'
      const now = mode.state === 'thinking'
      if (now && (!was || mode.option !== s.modeOption)) T.drivers.find((x) => x.id === mode.option)?.enter()
      if (now && !was) T.ack.impulse(1)
      if (!now && was) T.exhale.impulse(1)
      s.modeState = mode.state
      s.modeOption = mode.option
      s.modeAt = mode.at
    }
    const thinking = mode.state === 'thinking'
    T.ack.tick(dt)
    T.exhale.tick(dt)
    const ack = Math.max(0, T.ack.x)
    const exhale = T.exhale.x

    // the idle pose carries the dials; each option writes its own pose on top of a copy
    const idle = T.idle
    idle.spinRate = rotRate
    idle.accent = accent
    idle.chromatic = dial(D, 'cube.refraction')
    idle.sweepPeriod = Math.max(1, dial(D, 'cube.sweepPeriod'))
    idle.breathPeriod = 7 / Math.max(0.05, breath)
    idle.shadowSoft = dial(D, 'advanced.shadowSoft')
    let sum = 0
    T.drivers.forEach((drv, i) => {
      const active = thinking && mode.option === drv.id
      const a = T.amounts[i]
      a.target = active ? 1 : 0
      a.tune(active ? 0.9 : 0.55, 1)
      a.tick(dt)
      drv.tick({ dt, active, reduced: reducedMotion })
      const w = clamp01(a.x)
      const part = T.parts[i]
      part.w = w
      if (w > 1e-3) {
        copyPose(part.pose, idle)
        drv.write(part.pose)
      }
      sum += w
    })
    const wIdle = Math.max(0, 1 - sum)
    T.parts[T.drivers.length].w = wIdle
    const total = sum + wIdle
    for (const part of T.parts) part.w /= total
    const pose: Pose = T.pose
    blendPoses(pose, T.parts)
    AIR.rays = pose.airRays
    AIR.breeze = pose.airBreeze
    AIR.shimmer = pose.airShimmer

    // --- reveal choreography -------------------------------------------------
    const glassT = reducedMotion ? smooth(0, 1, r) : smooth(0.15, 0.85, r)
    const glassScale = reducedMotion ? glassT : backOut(glassT, 1.9) * glassT
    const coreScale = 0.2 + 0.8 * smooth(0, 0.6, r)
    const coreBoost = 1 + 1.6 * (1 - smooth(0.1, 0.75, r))
    const coreAlpha = smooth(0, 0.1, r)
    const causticOpacity = smooth(0.75, 1, r)
    const entranceYaw = reducedMotion ? 0 : (1 - easeOutCubic(smooth(0.05, 0.95, r))) * (Math.PI / 2)

    // --- press / tap springs ---------------------------------------------------
    const pressed = d.pressAt > 0
    const kP = 260
    const cP = 2 * Math.sqrt(kP)
    s.sqv += (kP * ((pressed ? 0.04 : 0) - s.sq) - cP * s.sqv) * dt
    s.sq += s.sqv * dt
    if (d.tapAt !== s.lastTap) {
      s.lastTap = d.tapAt
      s.wobv += reducedMotion ? 0.6 : 2.3
      s.flash = 1
    }
    const kW = 900
    const cW = 2 * 0.17 * Math.sqrt(kW)
    s.wobv += (-kW * s.wob - cW * s.wobv) * dt
    s.wob += s.wobv * dt
    s.flash = damp(s.flash, 0, 0.16, dt)
    const sqz = s.sq + s.wob
    const ex = 1 + 0.025 * exhale
    if (squash.current) squash.current.scale.set((1 + sqz * 0.5) * ex, (1 - sqz) * ex, (1 + sqz * 0.5) * ex)

    // --- rotation, float, lift, parallax ------------------------------------
    s.spin += pose.spinRate * dt
    const par = reducedMotion ? 0 : 0.1
    if (rig.current) {
      // yaw first (the turntable), then the tilt toward the camera, then a roll in the picture plane
      rig.current.rotation.set(
        TILT + pose.pitch + d.pitch - p.y * par,
        REST_YAW + s.spin + d.yaw + p.x * par + entranceYaw + pose.yawAdjust,
        pose.roll,
        'ZXY',
      )
      rig.current.position.y = (reducedMotion ? 0 : pose.floatAmp * Math.sin((t * Math.PI * 2) / 5)) + pose.lift
    }
    if (shell.current) shell.current.scale.setScalar(Math.max(1e-4, glassScale))
    if (glass.current) glass.current.visible = glassT > 0.002
    wireMatH.opacity = 0.3 * glassT
    wireMatV.opacity = 0.14 * glassT
    streakU.uEdgeColor.value.copy(edgeColor)
    // the air where the cube stands: a band crossing it lifts the bevel and the
    // sweep, so the light passing over the cube is something the cube is in and
    // not something happening behind it. Centred on the field's own mid value,
    // so a gap dims it exactly as much as a band brightens it.
    const air = clamp01(AIR.atCube)
    const answer = 1 + (air - 0.5) * 0.5 * rayStrength
    streakU.uEdgeGain.value = (0.45 + 0.35 * accent + 0.4 * s.flash + 0.35 * ack) * pose.edgeGain * answer
    streakU.uPrism.value = pose.prism
    streakU.uSweepWidth.value = pose.sweepWidth
    streakU.uStreakColor.value.setScalar(1.6 * answer)
    if (glass.current) {
      glass.current.updateWorldMatrix(true, false)
      streakU.uInvModel.value.copy(glass.current.matrixWorld).invert()
      glass.current.getWorldPosition(think.worldPos)
      glass.current.getWorldScale(think.worldScale)
      streakU.uCubeCenter.value.copy(think.worldPos)
      // hand the background the silhouette, in its p-space (NDC × 0.4, x by aspect)
      const cam = state.camera as THREE.PerspectiveCamera
      const halfH = Math.tan((cam.fov * Math.PI) / 360) * cam.position.distanceTo(think.worldPos)
      think.ndc.copy(think.worldPos).project(cam)
      SILHOUETTE.x = think.ndc.x * 0.4 * (state.size.width / state.size.height)
      SILHOUETTE.y = think.ndc.y * 0.4
      SILHOUETTE.r = ((SIZE * 0.707 * think.worldScale.x) / Math.max(halfH, 1e-3)) * 0.4
      // the caustic fan on the wall turns as the cube turns
      SILHOUETTE.yaw = rig.current ? rig.current.rotation.y : 0
    }
    const glassM = glassMat.current as unknown as { chromaticAberration: number } | null
    if (glassM) glassM.chromaticAberration = pose.chromatic

    // --- interior light --------------------------------------------------------
    s.breathPhase += (dt * Math.PI * 2) / Math.max(0.5, pose.breathPeriod)
    const breathe = 1 + pose.breathAmp * Math.sin(s.breathPhase)
    if (core.current) {
      core.current.scale.setScalar(breathe * coreScale * (1 + s.flash * 0.1))
      core.current.visible = coreAlpha > 0.001
      core.current.updateWorldMatrix(true, false)
      camObj.copy(state.camera.position)
      core.current.worldToLocal(camObj)
    }
    // the light pools toward whichever corner is low right now (Weigh), plus any body offset (Gather)
    if (rig.current) {
      T.q.copy(rig.current.quaternion).invert()
      T.downObj.set(0, -1, 0).applyQuaternion(T.q)
    }
    T.bodyPos.copy(T.downObj).multiplyScalar(pose.slosh * 0.26)
    T.bodyPos.x += pose.bx
    T.bodyPos.y += pose.by
    T.bodyPos.z += pose.bz
    T.kernelPos.set(pose.kx, pose.ky, pose.kz)
    const da = pose.dispAngle
    T.dispDir.set(Math.cos(da), 0.35 * Math.sin(0.7 * da), Math.sin(da)).normalize()
    const cu = coreMat.uniforms
    ;(cu.uCamObj.value as THREE.Vector3).copy(camObj)
    cu.uTime.value = t
    cu.uIntensity.value = glow * coreBoost * pose.bodyGain * (1 + s.flash * 1.4 + 0.3 * ack + 0.45 * exhale) * (0.94 + 0.06 * Math.sin(s.breathPhase))
    cu.uAlpha.value = coreAlpha
    cu.uAccent.value = pose.accent
    ;(cu.uCity.value as THREE.Color).set(city.hex)
    ;(cu.uBodyPos.value as THREE.Vector3).copy(T.bodyPos)
    cu.uBodyHalf.value = CORE_HALF * pose.bodyHalf
    ;(cu.uKernelPos.value as THREE.Vector3).copy(T.kernelPos)
    cu.uKernelHalf.value = CORE_HALF * pose.kernelHalf
    cu.uKernel.value = pose.kernel
    cu.uDisperse.value = pose.disperse
    ;(cu.uDispDir.value as THREE.Vector3).copy(T.dispDir)

    // --- specular sweep: an analytic strip light orbiting the cube -------------
    const period = Math.max(1, pose.sweepPeriod)
    if (!reducedMotion) s.sweep += (dt * Math.PI * 2) / period
    const sa = s.sweep + 0.6
    streakU.uStreakD.value.set(Math.cos(sa), 0.25, Math.sin(sa)).normalize()
    streakU.uStreakN.value.set(-Math.sin(sa), 0, Math.cos(sa))
    // the highlight crosses the faces once per period, over the first ~1.6 s of it
    const cyc = (s.sweep / (Math.PI * 2)) % 1
    // reduced motion: no travelling band at all (parked on the cube it read as a static hot spot)
    streakU.uSweepPhase.value = reducedMotion ? 10 : -1.4 + 2.8 * clamp01(cyc * (period / 1.6))
    streakU.uSweepAxis.value.set(Math.cos(sa * 0.5), 0.35, Math.sin(sa * 0.5)).normalize()

    // --- caustics: the pool follows the light --------------------------------
    const fu = causticMat.uniforms
    fu.uTime.value += dt * (reducedMotion ? 0 : pose.causticSpeed)
    fu.uOpacity.value = causticOpacity
    // one light: a stronger leak means a stronger pool
    fu.uIntensity.value =
      dial(D, 'floor.caustic') * pose.causticGain * (0.65 + 0.35 * rayStrength) * (0.85 + 0.3 * air)
    fu.uFlash.value = s.flash + 0.4 * ack + 0.5 * Math.max(0, exhale)
    fu.uAccent.value = pose.accent
    fu.uShift.value = pose.causticShift
    fu.uSharp.value = pose.causticSharp
    fu.uShadowSoft.value = pose.shadowSoft
    ;(fu.uCity.value as THREE.Color).set(city.hex)
    T.lightWorld.copy(T.bodyPos).lerp(T.kernelPos, pose.kernel)
    if (rig.current) T.lightWorld.applyQuaternion(rig.current.quaternion)
    ;(fu.uCenter.value as THREE.Vector2)
      .set(T.lightWorld.x, -T.lightWorld.z)
      .multiplyScalar(1.1 * pose.causticFollow)
      .add(setFloorThrow(T.throw2, T.L, 'pool'))
    ;(fu.uShadowOff.value as THREE.Vector2).copy(setFloorThrow(T.throw2, T.L, 'shadow'))
    if (floor.current) floor.current.visible = causticOpacity > 0.001
  })

  return (
    <group>
      <Studio quality={quality} azimuth={azDial} elevation={elDial} />

      {/* caustics + contact shadow on a flat floor just under the cube, seen from the raised camera */}
      <mesh ref={floor} position={[0, -SIZE / 2 - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5} material={causticMat}>
        <planeGeometry args={[2.8, 2.8]} />
      </mesh>

      <group ref={rig}>
        <group ref={squash}>
          <mesh ref={core} renderOrder={2} material={coreMat}>
            <boxGeometry args={[CORE_HALF * 2, CORE_HALF * 2, CORE_HALF * 2]} />
          </mesh>
          <group ref={shell}>
            <lineSegments geometry={wireH} material={wireMatH} scale={0.985} renderOrder={0} />
            <lineSegments geometry={wireV} material={wireMatV} scale={0.985} renderOrder={0} />
            <mesh ref={glass} geometry={geometry} renderOrder={1}>
              <MeshTransmissionMaterial
                ref={glassMat}
                transmission={1}
                roughness={0.04}
                thickness={thicknessDial}
                ior={1.5}
                anisotropicBlur={0.05}
                distortion={low || reducedMotion ? 0 : 0.08}
                distortionScale={0.45}
                temporalDistortion={0.05}
                color="#ffffff"
                attenuationColor={NUMA_PINK}
                attenuationDistance={14}
                envMapIntensity={1.7}
                resolution={low ? 256 : 1024}
                samples={samples}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

export const cube: Direction = {
  id: 'cube',
  name: 'Cube',
  oneLiner: 'a cube of light, reflecting care and possibility',
  camera: { position: [0, 2.6, 10.6], fov: 32 },
  thinkingOptions: THINKING_OPTIONS,
  dials: DIALS,
  Background,
  Entity,
  Effects,
}
