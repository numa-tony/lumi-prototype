"use client";

// The cube, composed for a phone screen rather than a full viewport.
//
// Upstream's Stage fills the browser and crossfades between three directions.
// Here there is one direction and it lives inside a 368×822 sheet, so this
// keeps upstream's camera rig (which is what makes the cube read at hero size)
// and replaces everything else with the handful of knobs the chat needs:
// how big the cube is, where it sits, and how far the whole scene has revealed.
//
// Never imported directly — go through CubeStage, which keeps it off the
// server and out of the initial bundle.
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { NUMA_CANVAS, cityById } from "./vendor/lib/cities";
import { DEFAULT_CAMERA, ENTITY_Y } from "./vendor/shell/rig";
import { cube } from "./vendor/directions/cube";
import type { DirectionProps } from "./vendor/directions/types";
import { useAmbientInputs } from "./useAmbientInputs";
import { FIELD, GradientBackdrop } from "./GradientBackdrop";

/** Seconds for the scene to cover half the distance to its reveal target. */
const REVEAL_HALFLIFE = 0.22;

/**
 * What sits behind the cube.
 *  · "field"    — upstream's light-through-a-curtain canvas (Figma 7274-12724)
 *  · "gradient" — the pink→sage field (Figma 7206-14806)
 * Both render inside the scene, so the glass refracts either one.
 */
export type Backdrop = "field" | "gradient";

export interface CubeComposition {
  /** Multiplies the cube's hero size. 1 = upstream's phone hero scale. */
  scale: number;
  /** World-unit offset from the rig's resting position. +y is up. */
  offsetX: number;
  offsetY: number;
  /** 0 = fully dematerialised, 1 = fully present. Animated, not snapped. */
  reveal: number;
}

export const DEFAULT_COMPOSITION: CubeComposition = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  reveal: 1,
};

interface Props {
  composition: CubeComposition;
  backdrop?: Backdrop;
  /** Tuning for the gradient backdrop; ignored by "field". */
  gradient?: { pinkStop?: number; sageStop?: number; lobe?: number };
  /** Which city's accent the cube's heart takes. */
  cityId: string;
  /** Force the cheap path (smaller transmission buffer, fewer samples). */
  forceLowQuality?: boolean;
  /** Per-frame parallax follows the pointer over this element. */
  pointerTarget: React.RefObject<HTMLElement | null>;
}

/**
 * One useFrame, ahead of the cube's own, that advances our inputs and eases
 * the composition. The scene reads mutable holders rather than props, so a
 * slider in the lab never rebuilds a material.
 */
function Driver({
  tick,
  reveal,
  target,
  rig,
  scale,
  offsetX,
  offsetY,
}: {
  tick: (dt: number) => void;
  reveal: { current: number };
  target: number;
  rig: React.RefObject<THREE.Group | null>;
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    tick(dt);
    reveal.current += (target - reveal.current) * (1 - Math.pow(0.5, dt / REVEAL_HALFLIFE));
    if (target === 1 && reveal.current > 0.999) reveal.current = 1;
    if (target === 0 && reveal.current < 0.001) reveal.current = 0;

    const g = rig.current;
    if (!g) return;
    // Eased so docking is a move, not a cut.
    const k = 1 - Math.pow(0.5, dt / 0.14);
    g.scale.setScalar(g.scale.x + (scale - g.scale.x) * k);
    g.position.x += (offsetX - g.position.x) * k;
    g.position.y += (ENTITY_Y + offsetY - g.position.y) * k;
  });
  return null;
}

/**
 * Development handle, in the spirit of `window.__lumi`.
 *
 * The preview pane runs hidden, which stops rAF — so a scene driven entirely
 * by `useFrame` never draws a single frame there, and a screenshot shows only
 * the clear colour. That looks exactly like a broken scene and isn't one.
 * `__lumiScene.step(n)` advances the loop by hand, so the cube can be verified
 * and captured without a visible tab.
 */
function publishDevHandle(state: RootState) {
  if (process.env.NODE_ENV === "production") return;
  // Deliberately hung off `onCreated` rather than a component inside the
  // Canvas: with rAF stopped, react-three-fiber never commits the scene's
  // children, so an in-scene effect would never get the chance to run — which
  // is precisely the situation this handle exists to rescue.
  (window as unknown as Record<string, unknown>).__lumiScene = {
    /** Advance n frames of simulated time, ~60fps apart. */
    step: (n = 1) => {
      for (let i = 0; i < n; i++) state.advance(performance.now() + i * 16.7, true);
    },
    state,
  };
}

function CameraRig() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const c = cube.camera ?? DEFAULT_CAMERA;
    camera.position.set(...c.position);
    if ("fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = c.fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    camera.lookAt(0, ENTITY_Y, 0);
  }, [camera]);
  return null;
}

export default function CubeScene({
  composition,
  backdrop = "field",
  gradient,
  cityId,
  forceLowQuality,
  pointerTarget,
}: Props) {
  const { inputs, tick } = useAmbientInputs(pointerTarget);
  const rig = useRef<THREE.Group>(null);

  // Read once: both are media queries, and neither should re-render the scene.
  const [reduced] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [coarse] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(pointer: coarse)").matches,
  );
  const quality: "high" | "low" = forceLowQuality || coarse ? "low" : "high";

  const props: DirectionProps = useMemo(
    () => ({ city: cityById(cityId), inputs, reducedMotion: reduced, quality }),
    [cityId, inputs, reduced, quality],
  );

  return (
    <Canvas
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        toneMapping: THREE.NeutralToneMapping,
      }}
      camera={{ position: DEFAULT_CAMERA.position, fov: DEFAULT_CAMERA.fov, near: 0.1, far: 80 }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={publishDevHandle}
    >
      <color attach="background" args={[backdrop === "gradient" ? FIELD.top : NUMA_CANVAS]} />
      <Driver
        tick={tick}
        reveal={inputs.reveal}
        target={composition.reveal}
        rig={rig}
        scale={composition.scale}
        offsetX={composition.offsetX}
        offsetY={composition.offsetY}
      />
      <CameraRig />
      {backdrop === "gradient" ? (
        // Note: without upstream's background mounted, the entity's `AIR.atCube`
        // — the CPU mirror of the light-band field — holds its neutral 0.5, so
        // the cube keeps its glass and its interior light but loses the
        // band-driven shimmer on its bevel. There are no bands here to shimmer
        // with, so that is the right answer rather than a compromise.
        <GradientBackdrop {...gradient} reveal={inputs.reveal} />
      ) : (
        <cube.Background {...props} />
      )}
      <group ref={rig} position={[0, ENTITY_Y, 0]}>
        <cube.Entity {...props} />
      </group>
    </Canvas>
  );
}
