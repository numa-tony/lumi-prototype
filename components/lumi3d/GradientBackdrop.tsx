"use client";

// The pink→sage field from Figma 7206-14806, as an alternative to the cube's
// own lit canvas.
//
// This is *not* vendored. Upstream's background paints light through a curtain
// on Numa's near-white canvas (#f7f3f0) — a whole system of pleats, plaster
// relief and spectral caustics built around a surface that is only ~12 sRGB
// levels below white. The frame here wants something else entirely: a
// saturated colour field. Reaching it by bending upstream's dials would fight
// every assumption that shader makes, so this is a separate, much simpler
// backdrop that can be swapped in behind the same cube.
//
// It lives in the scene rather than in the DOM behind the canvas, and that is
// the point: MeshTransmissionMaterial refracts whatever is *rendered behind
// it*, so an in-scene plane means the cube actually picks the pink and green
// up through the glass. A CSS gradient behind a transparent canvas would leave
// the cube looking pasted onto it.
//
// Colours are sampled from the frame down its left edge, clear of the cube and
// the composer pill.
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Distance from the camera to the backdrop, matching upstream's z = -30 plane
 *  at the default rig — far enough behind the cube to read as a field, not a
 *  wall it is sitting against. */
const DIST = 41;

/** Sampled from 7206-14806. The pink plateau is the DS `lumi-pink` token. */
export const FIELD = {
  top: "#ffeff2",
  /** The ramp's pink at the *edges* of the frame… */
  pinkBase: "#ffdee4",
  /** …and the saturated lobe through the middle, which is the DS token. */
  pink: "#ffc9d2",
  mid: "#efdad9",
  sage: "#c1cdba",
  foot: "#d5dfd0",
};

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 uTop, uPinkBase, uPink, uMid, uSage, uFoot;
uniform float uPinkStop, uSageStop, uLobe, uAspect, uReveal;

// Cheap value hash — only ever used for ±1 LSB of dither.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 ramp(float t) {
  // The base ramp carries the frame's *edge* colours; the lobe below supplies
  // the saturation through the middle. Building the ramp from the saturated
  // pink instead makes the whole field a stop hotter than the frame.
  vec3 c = mix(uTop, uPinkBase, smoothstep(0.0, uPinkStop, t));
  c = mix(c, uMid,  smoothstep(uPinkStop, mix(uPinkStop, uSageStop, 0.45), t));
  c = mix(c, uSage, smoothstep(mix(uPinkStop, uSageStop, 0.45), uSageStop, t));
  c = mix(c, uFoot, smoothstep(uSageStop, 1.0, t));
  return c;
}

void main() {
  float t = 1.0 - vUv.y;              // 0 at the top of the screen
  vec3 col = ramp(t);

  // The frame is not a flat vertical ramp: the pink is denser through the
  // middle of the upper half and washes out toward the edges.
  vec2 d = vec2((vUv.x - 0.5) * uAspect, t - 0.26);
  col = mix(col, uPink, clamp(exp(-dot(d, d) * 3.2) * uLobe, 0.0, 1.0));

  // Materialise with the rest of the scene.
  gl_FragColor = vec4(mix(vec3(1.0), col, uReveal), 1.0);

  // Uniforms arrive in the linear working space, so the conversion back is not
  // optional — without it the field renders a stop darker and far more
  // saturated than the frame. Upstream's shaders end the same way, and dither
  // after it: a ramp this long bands visibly at 8 bits.
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
}`;

export interface GradientBackdropProps {
  /** 0..1 — where the pink plateau ends. */
  pinkStop?: number;
  /** 0..1 — where the sage bottoms out. */
  sageStop?: number;
  /** Strength of the radial pink concentration. */
  lobe?: number;
  /** Shell-driven reveal, same holder the vendored background reads. */
  reveal?: { current: number };
}

export function GradientBackdrop({
  pinkStop = 0.34,
  sageStop = 0.86,
  lobe = 0.55,
  reveal,
}: GradientBackdropProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTop: { value: new THREE.Color(FIELD.top) },
          uPinkBase: { value: new THREE.Color(FIELD.pinkBase) },
          uPink: { value: new THREE.Color(FIELD.pink) },
          uMid: { value: new THREE.Color(FIELD.mid) },
          uSage: { value: new THREE.Color(FIELD.sage) },
          uFoot: { value: new THREE.Color(FIELD.foot) },
          uPinkStop: { value: pinkStop },
          uSageStop: { value: sageStop },
          uLobe: { value: lobe },
          uAspect: { value: 1 },
          uReveal: { value: 1 },
        },
      }),
    // Built once; the frame loop writes the uniforms. Rebuilding a material to
    // move a slider is what the mutable-holder pattern exists to avoid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const forward = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uPinkStop.value = pinkStop;
    u.uSageStop.value = sageStop;
    u.uLobe.value = lobe;
    u.uReveal.value = reveal ? reveal.current : 1;

    const m = mesh.current;
    if (!m) return;

    // Parked on the camera's own view axis and turned to face it, rather than
    // sat at the world origin. The rig looks at the entity rather than
    // straight ahead, so a plane centred on the origin leaves a wedge of the
    // frustum uncovered — which shows up as a hard line across the screen
    // where the clear colour takes over.
    camera.getWorldDirection(forward);
    m.position.copy(camera.position).addScaledVector(forward, DIST);
    m.quaternion.copy(camera.quaternion);

    const v = state.viewport.getCurrentViewport(camera, m.position);
    u.uAspect.value = v.width / Math.max(v.height, 1e-3);
    // A little proud of the frustum, so a resize can never expose an edge.
    m.scale.set(v.width * 1.04, v.height * 1.04, 1);
  });

  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={-10} material={material}>
      <planeGeometry />
    </mesh>
  );
}
