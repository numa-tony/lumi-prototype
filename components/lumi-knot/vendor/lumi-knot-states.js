// ⚠️  VENDORED — DO NOT EDIT.
// Copied from numa-lumi-branding/lumi-knot-states.js @ 0c2ea6e9950f
// by scripts/sync-lumi-knot.mjs. Change it upstream and re-run the script.

// Lumi knot: state presets + morph shader, kept portable.
//
// No three.js imports here on purpose — the GLSL is plain strings and the
// presets are plain numbers, so when the asset is rebuilt for React Native
// (r3f/expo-gl, Filament, or a baked fallback) this file carries over as-is.

// Each state maps to motion params. `noiseAmp` is what makes the knot morph —
// vertices are displaced along their normals by 3D simplex noise; the rest set
// how fast it tumbles and breathes.
// Beyond the original tumble/noise/pulse:
//   rotSpeedZ          — spin around the view axis
//   wobbleAmp/wobbleHz — precession: the whole knot tilts in a slow circle,
//                        like a spinning top losing balance
//   twistAmp/twistHz   — the body wrings around its own vertical axis and
//                        back (done in the vertex shader, so it's free)
//   floatAmp/floatHz   — slow vertical bob, in local units. Reads as weight:
//                        a crystal that hangs in the air needs it, the knot
//                        (which tumbles) doesn't, so it defaults to 0.
//   knot               — the state's geometry (p/q/tube/squash). Swapped, not
//                        tweened: p/q are winding counts, there's nothing in
//                        between two knots.
const BASE_KNOT = { p: 4, q: 5, tube: 0.2, squash: 1 };

export const STATE_PRESETS = {
  idle: {
    knot: { p: 3, q: 5, tube: 0.25, squash: 0.9 },
    rotSpeedX: 0, rotSpeedY: 0, rotSpeedZ: 0.08,
    noiseAmp: 0, noiseFreq: 3.2, noiseSpeed: 1,
    pulseAmp: 0.1, pulseHz: 0,
    wobbleAmp: 0, wobbleHz: 0,
    twistAmp: 0.12, twistHz: 0.15,
    floatAmp: 0, floatHz: 0,
  },
  listening: {
    knot: { ...BASE_KNOT },
    rotSpeedX: 0.05, rotSpeedY: 0.10, rotSpeedZ: 0,
    noiseAmp: 0.16, noiseFreq: 2.6, noiseSpeed: 1.4,
    pulseAmp: 0.05, pulseHz: 1.1,
    wobbleAmp: 0.12, wobbleHz: 1.0,
    twistAmp: 0.15, twistHz: 0.9,
    floatAmp: 0, floatHz: 0,
  },
  thinking: {
    knot: { p: 3, q: 5, tube: 0.25, squash: 0.9 },
    rotSpeedX: 0.3, rotSpeedY: 0.19, rotSpeedZ: 1.57,
    noiseAmp: 0, noiseFreq: 3.2, noiseSpeed: 1,
    pulseAmp: 0.1, pulseHz: 0,
    wobbleAmp: 0, wobbleHz: 0,
    twistAmp: 0, twistHz: 0,
    floatAmp: 0, floatHz: 0,
  },
  processing: {
    knot: { ...BASE_KNOT },
    rotSpeedX: 0.45, rotSpeedY: 0.75, rotSpeedZ: 0.4,
    noiseAmp: 0.12, noiseFreq: 3.2, noiseSpeed: 2.2,
    pulseAmp: 0.03, pulseHz: 2.0,
    wobbleAmp: 0, wobbleHz: 0,
    twistAmp: 0.2, twistHz: 1.2,
    floatAmp: 0, floatHz: 0,
  },
  searching: {
    knot: { ...BASE_KNOT },
    rotSpeedX: 0.30, rotSpeedY: 0.85, rotSpeedZ: 0,
    noiseAmp: 0.30, noiseFreq: 0.9, noiseSpeed: 0.9,
    pulseAmp: 0.04, pulseHz: 0.7,
    wobbleAmp: 0.3, wobbleHz: 0.6,
    twistAmp: 0, twistHz: 0,
    floatAmp: 0, floatHz: 0,
  },
};

export const STATES = Object.keys(STATE_PRESETS);

/**
 * Exponential glide of `current` towards `target`, field by field.
 * Frame-rate independent (`halflife` = seconds to close half the gap), so state
 * switches ease instead of snapping. Mutates and returns `current`.
 */
export function tickTowards(current, target, dt, halflife = 0.35) {
  const k = 1 - Math.pow(0.5, dt / halflife);
  for (const key of Object.keys(target)) {
    const c = current[key];
    if (typeof c === "number") current[key] = c + (target[key] - c) * k;
    else current[key] = target[key];
  }
  return current;
}

// ---- GLSL — shared by both web materials, portable to any GLSL renderer ----

// Ashima/ijm 3D simplex noise (MIT), the standard webgl-noise implementation.
export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// View-angle-driven rainbow, applied on top of whatever the material rendered.
// This is the dialable part of the holographic look — the matcap texture and
// the env map stay fixed while these uniforms move the rainbow around. Hue
// runs off the facing angle (thin-film style: colour shifts as the surface
// turns) plus a positional band so it streaks along the body.
export const RAINBOW_GLSL = /* glsl */ `
uniform float uRainbowStrength;
uniform float uRainbowSpread;
uniform float uRainbowHue;
uniform float uRainbowFresnel;
uniform float uRainbowFreq;
uniform float uRainbowSat;
varying vec3 vLumiPos;

vec3 lumiHsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
`;

// Runs right before three's output chunk, where `outgoingLight`, `normal` and
// `vViewPosition` all exist (true for both matcap and physical shaders).
// Screen-blended so chrome highlights stay white instead of tinting.
export const RAINBOW_APPLY_GLSL = /* glsl */ `
{
  vec3 lumiV = normalize(vViewPosition);
  float lumiFacing = clamp(dot(lumiV, normal), 0.0, 1.0);
  float lumiFres = pow(1.0 - lumiFacing, uRainbowFresnel);
  float lumiH = fract(uRainbowHue + lumiFacing * uRainbowSpread + dot(vLumiPos, vec3(0.35, 0.55, 0.25)) * uRainbowFreq);
  vec3 lumiRainbow = lumiHsv2rgb(vec3(lumiH, uRainbowSat, 1.0));
  vec3 lumiScreen = 1.0 - (1.0 - clamp(outgoingLight, 0.0, 1.0)) * (1.0 - lumiRainbow);
  outgoingLight = mix(outgoingLight, lumiScreen, uRainbowStrength * lumiFres);
}
`;

// Displacement along the normal. Sampling noise at the *undisplaced* position
// keeps neighbouring vertices coherent, so the surface flows instead of tearing.
// Normals are re-tilted by the noise gradient (finite differences would be
// exact; this cheap gradient-of-noise tilt is visually indistinguishable here).
export const DISPLACE_GLSL = /* glsl */ `
uniform float uTime;
uniform float uNoiseAmp;
uniform float uNoiseFreq;
uniform float uTwist;

// Rigid rotation around Y whose angle grows with height — the "wring" motion.
// Driven by the undisplaced position's y so vertices and normals agree.
vec2 lumiTwistRot(vec2 xz, float y) {
  float a = uTwist * y;
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * xz;
}

vec3 lumiDisplace(vec3 pos, vec3 nrm) {
  float n = snoise(pos * uNoiseFreq + vec3(0.0, 0.0, uTime));
  return pos + nrm * (n * uNoiseAmp);
}

vec3 lumiPerturbNormal(vec3 pos, vec3 nrm) {
  float e = 0.08;
  float n0 = snoise(pos * uNoiseFreq + vec3(0.0, 0.0, uTime));
  vec3 grad = vec3(
    snoise((pos + vec3(e, 0.0, 0.0)) * uNoiseFreq + vec3(0.0, 0.0, uTime)) - n0,
    snoise((pos + vec3(0.0, e, 0.0)) * uNoiseFreq + vec3(0.0, 0.0, uTime)) - n0,
    snoise((pos + vec3(0.0, 0.0, e)) * uNoiseFreq + vec3(0.0, 0.0, uTime)) - n0
  ) / e;
  // Remove the component along the normal, tilt by the tangential remainder.
  vec3 tangentGrad = grad - nrm * dot(grad, nrm);
  return normalize(nrm - tangentGrad * uNoiseAmp);
}
`;
