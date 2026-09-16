// ⚠️  VENDORED — DO NOT EDIT.
// Copied from numa-lumi-branding/lumi-knot-morph.js @ 0c2ea6e9950f
// by scripts/sync-lumi-knot.mjs. Change it upstream and re-run the script.

// Continuous shape morph across the Platonic solids, in the vertex shader.
//
// The discrete shapes in lumi-knot-shapes.js can't tween into each other (you
// can't interpolate between two meshes without matching topology). This does it
// differently: start from one base icosphere and treat every vertex as a
// *direction*, then push it out to whatever radius the target solid has along
// that direction. Blending two radii blends two solids, so one dial walks the
// whole ladder.
//
// The dial is the solid's face count, which is also its die number, so the
// numbers stay meaningful:
//
//    0  sphere
//    4  tetrahedron — the pyramid (4 faces and 4 points)
//    6  cube
//    8  octahedron
//   12  dodecahedron
//   20  icosahedron — the gem matching the reference render
//
// Values between two rungs are a real blend of both, not a snap.
//
// Every radius comes from a p-norm over the solid's face normals:
//
//   r(d) = 1 / ( Σ max(dot(d, nᵢ), 0)^q )^(1/q)
//
// Same formula for every solid — only the normal set and the exponent change.
// As q rises the norm approaches max(), i.e. flat faces with sharp edges, so q
// is a bevel dial for free: low = rounded pebble, high = cut crystal.
//
// max(dot, 0) rather than |dot| is what lets the tetrahedron work. Every other
// solid here is centrally symmetric, so its faces come in opposing pairs and
// |dot| over half the set is equivalent (and cheaper) — but a tetrahedron's
// faces have no opposite partner, and folding them with |dot| would silently
// render an octahedron instead.
//
// No three.js import here on purpose — same rule as lumi-knot-states.js, so the
// GLSL carries over to r3f/expo-gl or any other renderer unchanged.

export const MORPH_GLSL = /* glsl */ `
uniform float uMorphOn;     // 0 = leave the geometry alone (knot, rings, ...)
uniform float uMorphSides;  // 0 sphere - 4 pyramid - 6 cube - 8 - 12 - 20 gem
uniform float uMorphSharp;  // p-norm exponent: low = rounded, high = hard facets
uniform float uMorphScale;
// Per-solid size normalisation, recomputed on the CPU whenever the exponent
// changes (see morphNormalisers). The raw norm puts *faces* at radius 1, which
// leaves each solid a different distance to its corners — a cube reaches
// sqrt(3), a tetrahedron a full 3x. Without these the size would pump wildly as
// the dial walks the ladder. Each rescales its solid to circumradius 1.
uniform float uMorphNormTetra;
uniform float uMorphNormCube;
uniform float uMorphNormOcta;
uniform float uMorphNormDodeca;
uniform float uMorphNormIcosa;

#define LUMI_PHI 1.6180339887
#define LUMI_R3  0.5773502692
// Icosahedron vertex directions, used as the dodecahedron's 12 face normals.
#define LUMI_VA  0.5257311121
#define LUMI_VB  0.8506508084

// --- Face-normal sets. Symmetric solids list one axis per opposing pair. ---
const vec3 LUMI_T0 = vec3( LUMI_R3,  LUMI_R3,  LUMI_R3);
const vec3 LUMI_T1 = vec3( LUMI_R3, -LUMI_R3, -LUMI_R3);
const vec3 LUMI_T2 = vec3(-LUMI_R3,  LUMI_R3, -LUMI_R3);
const vec3 LUMI_T3 = vec3(-LUMI_R3, -LUMI_R3,  LUMI_R3);

const vec3 LUMI_O0 = vec3( LUMI_R3,  LUMI_R3,  LUMI_R3);
const vec3 LUMI_O1 = vec3( LUMI_R3,  LUMI_R3, -LUMI_R3);
const vec3 LUMI_O2 = vec3( LUMI_R3, -LUMI_R3,  LUMI_R3);
const vec3 LUMI_O3 = vec3( LUMI_R3, -LUMI_R3, -LUMI_R3);

const vec3 LUMI_D0 = vec3(0.0,  LUMI_VA,  LUMI_VB);
const vec3 LUMI_D1 = vec3(0.0,  LUMI_VA, -LUMI_VB);
const vec3 LUMI_D2 = vec3( LUMI_VA,  LUMI_VB, 0.0);
const vec3 LUMI_D3 = vec3( LUMI_VA, -LUMI_VB, 0.0);
const vec3 LUMI_D4 = vec3( LUMI_VB, 0.0,  LUMI_VA);
const vec3 LUMI_D5 = vec3(-LUMI_VB, 0.0,  LUMI_VA);

const vec3 LUMI_I0 = vec3( LUMI_R3,  LUMI_R3,  LUMI_R3);
const vec3 LUMI_I1 = vec3( LUMI_R3,  LUMI_R3, -LUMI_R3);
const vec3 LUMI_I2 = vec3( LUMI_R3, -LUMI_R3,  LUMI_R3);
const vec3 LUMI_I3 = vec3( LUMI_R3, -LUMI_R3, -LUMI_R3);
const vec3 LUMI_I4 = vec3(0.0,  LUMI_R3 / LUMI_PHI,  LUMI_R3 * LUMI_PHI);
const vec3 LUMI_I5 = vec3(0.0,  LUMI_R3 / LUMI_PHI, -LUMI_R3 * LUMI_PHI);
const vec3 LUMI_I6 = vec3( LUMI_R3 / LUMI_PHI,  LUMI_R3 * LUMI_PHI, 0.0);
const vec3 LUMI_I7 = vec3( LUMI_R3 / LUMI_PHI, -LUMI_R3 * LUMI_PHI, 0.0);
const vec3 LUMI_I8 = vec3( LUMI_R3 * LUMI_PHI, 0.0,  LUMI_R3 / LUMI_PHI);
const vec3 LUMI_I9 = vec3(-LUMI_R3 * LUMI_PHI, 0.0,  LUMI_R3 / LUMI_PHI);

// Every sum below is factored by its own largest term before being raised to q:
//
//   (Sum |xi|^q)^(1/q)  ==  m * (Sum (|xi|/m)^q)^(1/q),   m = max|xi|
//
// which is the standard numerically-stable p-norm. Written the naive way, a
// direction whose terms are all well under 1 sends every |xi|^q toward zero as
// q grows: at q = 60 a cube's whole corner region underflowed into a clamp, so
// the radius came back *constant* there and the corners rendered as sphere
// patches with a speckled rim. Factoring m out keeps the largest term at
// exactly 1.0, so the sum stays in [1, n] at any exponent and nothing is lost.

float lumiTetraRadius(vec3 d, float q) {
  float a0 = max(dot(d, LUMI_T0), 0.0), a1 = max(dot(d, LUMI_T1), 0.0);
  float a2 = max(dot(d, LUMI_T2), 0.0), a3 = max(dot(d, LUMI_T3), 0.0);
  float m = max(max(a0, a1), max(a2, a3));
  if (m <= 0.0) return 1.0;
  float s = pow(a0 / m, q) + pow(a1 / m, q) + pow(a2 / m, q) + pow(a3 / m, q);
  return 1.0 / (m * pow(s, 1.0 / q));
}

float lumiCubeRadius(vec3 d, float q) {
  vec3 a = abs(d);
  float m = max(a.x, max(a.y, a.z));
  if (m <= 0.0) return 1.0;
  vec3 t = a / m;
  return 1.0 / (m * pow(pow(t.x, q) + pow(t.y, q) + pow(t.z, q), 1.0 / q));
}

float lumiOctaRadius(vec3 d, float q) {
  float a0 = abs(dot(d, LUMI_O0)), a1 = abs(dot(d, LUMI_O1));
  float a2 = abs(dot(d, LUMI_O2)), a3 = abs(dot(d, LUMI_O3));
  float m = max(max(a0, a1), max(a2, a3));
  if (m <= 0.0) return 1.0;
  float s = pow(a0 / m, q) + pow(a1 / m, q) + pow(a2 / m, q) + pow(a3 / m, q);
  return 1.0 / (m * pow(s, 1.0 / q));
}

float lumiDodecaRadius(vec3 d, float q) {
  float a0 = abs(dot(d, LUMI_D0)), a1 = abs(dot(d, LUMI_D1)), a2 = abs(dot(d, LUMI_D2));
  float a3 = abs(dot(d, LUMI_D3)), a4 = abs(dot(d, LUMI_D4)), a5 = abs(dot(d, LUMI_D5));
  float m = max(max(max(a0, a1), max(a2, a3)), max(a4, a5));
  if (m <= 0.0) return 1.0;
  float s = pow(a0 / m, q) + pow(a1 / m, q) + pow(a2 / m, q)
          + pow(a3 / m, q) + pow(a4 / m, q) + pow(a5 / m, q);
  return 1.0 / (m * pow(s, 1.0 / q));
}

float lumiIcosaRadius(vec3 d, float q) {
  float a0 = abs(dot(d, LUMI_I0)), a1 = abs(dot(d, LUMI_I1));
  float a2 = abs(dot(d, LUMI_I2)), a3 = abs(dot(d, LUMI_I3));
  float a4 = abs(dot(d, LUMI_I4)), a5 = abs(dot(d, LUMI_I5));
  float a6 = abs(dot(d, LUMI_I6)), a7 = abs(dot(d, LUMI_I7));
  float a8 = abs(dot(d, LUMI_I8)), a9 = abs(dot(d, LUMI_I9));
  float m = max(max(max(a0, a1), max(a2, a3)), max(max(a4, a5), max(max(a6, a7), max(a8, a9))));
  if (m <= 0.0) return 1.0;
  float s = pow(a0 / m, q) + pow(a1 / m, q) + pow(a2 / m, q) + pow(a3 / m, q)
          + pow(a4 / m, q) + pow(a5 / m, q) + pow(a6 / m, q) + pow(a7 / m, q)
          + pow(a8 / m, q) + pow(a9 / m, q);
  return 1.0 / (m * pow(s, 1.0 / q));
}

// Normals straight from the implicit surface's gradient - exact, no epsilon.
//
//   F(p) = Sum max(dot(p, ni), 0)^q     the solid is the level set F = 1
//   grad = Sum q * max(dot,0)^(q-1) * ni
//
// F is homogeneous, so the gradient at the *direction* points the same way as
// at the surface point, and the common q factor drops out on normalize.
//
// This replaced a finite-difference version that sampled two nearby directions
// and crossed the edges. That looked fine at low sharpness but tore at high:
// once the exponent makes an edge narrower than the sample step, the samples
// straddle it and the cross product returns garbage - a dark, speckled fringe
// along every edge. No step size fixes it for all q, hence going analytic.
//
// A flat face yields one constant gradient, so facets read flat; an edge gets
// the smooth bisector of the faces it joins, shading like a fine bevel rather
// than a tear. Same factor-by-largest-term guard as the radii, without which
// every weight underflows at high q and normalize() is handed a zero vector.

vec3 lumiTetraNormal(vec3 d, float q) {
  float e = q - 1.0;
  float a0 = max(dot(d, LUMI_T0), 0.0), a1 = max(dot(d, LUMI_T1), 0.0);
  float a2 = max(dot(d, LUMI_T2), 0.0), a3 = max(dot(d, LUMI_T3), 0.0);
  float m = max(max(a0, a1), max(a2, a3));
  if (m <= 0.0) return d;
  return pow(a0 / m, e) * LUMI_T0 + pow(a1 / m, e) * LUMI_T1
       + pow(a2 / m, e) * LUMI_T2 + pow(a3 / m, e) * LUMI_T3;
}

vec3 lumiCubeNormal(vec3 d, float q) {
  float e = q - 1.0;
  vec3 a = abs(d);
  float m = max(a.x, max(a.y, a.z));
  if (m <= 0.0) return d;
  vec3 t = a / m;
  return vec3(pow(t.x, e) * sign(d.x), pow(t.y, e) * sign(d.y), pow(t.z, e) * sign(d.z));
}

vec3 lumiOctaNormal(vec3 d, float q) {
  float e = q - 1.0;
  float p0 = dot(d, LUMI_O0), p1 = dot(d, LUMI_O1), p2 = dot(d, LUMI_O2), p3 = dot(d, LUMI_O3);
  float m = max(max(abs(p0), abs(p1)), max(abs(p2), abs(p3)));
  if (m <= 0.0) return d;
  return pow(abs(p0) / m, e) * sign(p0) * LUMI_O0 + pow(abs(p1) / m, e) * sign(p1) * LUMI_O1
       + pow(abs(p2) / m, e) * sign(p2) * LUMI_O2 + pow(abs(p3) / m, e) * sign(p3) * LUMI_O3;
}

vec3 lumiDodecaNormal(vec3 d, float q) {
  float e = q - 1.0;
  float p0 = dot(d, LUMI_D0), p1 = dot(d, LUMI_D1), p2 = dot(d, LUMI_D2);
  float p3 = dot(d, LUMI_D3), p4 = dot(d, LUMI_D4), p5 = dot(d, LUMI_D5);
  float m = max(max(max(abs(p0), abs(p1)), max(abs(p2), abs(p3))), max(abs(p4), abs(p5)));
  if (m <= 0.0) return d;
  return pow(abs(p0) / m, e) * sign(p0) * LUMI_D0 + pow(abs(p1) / m, e) * sign(p1) * LUMI_D1
       + pow(abs(p2) / m, e) * sign(p2) * LUMI_D2 + pow(abs(p3) / m, e) * sign(p3) * LUMI_D3
       + pow(abs(p4) / m, e) * sign(p4) * LUMI_D4 + pow(abs(p5) / m, e) * sign(p5) * LUMI_D5;
}

vec3 lumiIcosaNormal(vec3 d, float q) {
  float e = q - 1.0;
  float p0 = dot(d, LUMI_I0), p1 = dot(d, LUMI_I1), p2 = dot(d, LUMI_I2);
  float p3 = dot(d, LUMI_I3), p4 = dot(d, LUMI_I4), p5 = dot(d, LUMI_I5);
  float p6 = dot(d, LUMI_I6), p7 = dot(d, LUMI_I7), p8 = dot(d, LUMI_I8);
  float p9 = dot(d, LUMI_I9);
  float m = max(max(max(abs(p0), abs(p1)), max(abs(p2), abs(p3))),
            max(max(abs(p4), abs(p5)), max(max(abs(p6), abs(p7)), max(abs(p8), abs(p9)))));
  if (m <= 0.0) return d;
  vec3 g = vec3(0.0);
  g += pow(abs(p0) / m, e) * sign(p0) * LUMI_I0;
  g += pow(abs(p1) / m, e) * sign(p1) * LUMI_I1;
  g += pow(abs(p2) / m, e) * sign(p2) * LUMI_I2;
  g += pow(abs(p3) / m, e) * sign(p3) * LUMI_I3;
  g += pow(abs(p4) / m, e) * sign(p4) * LUMI_I4;
  g += pow(abs(p5) / m, e) * sign(p5) * LUMI_I5;
  g += pow(abs(p6) / m, e) * sign(p6) * LUMI_I6;
  g += pow(abs(p7) / m, e) * sign(p7) * LUMI_I7;
  g += pow(abs(p8) / m, e) * sign(p8) * LUMI_I8;
  g += pow(abs(p9) / m, e) * sign(p9) * LUMI_I9;
  return g;
}

// --- The ladder ------------------------------------------------------------
// Rungs sit at 0, 4, 6, 8, 12, 20; anything between blends the two either side.
// The rungs are unevenly spaced on purpose — the number means something (it is
// the face count), so the dial is not linear in "shape complexity" and the
// stretch from 12 to 20 covers more ground than 4 to 6.

float lumiSidesRadius(vec3 d, float v, float q) {
  if (v <= 0.0) return 1.0;
  if (v < 4.0)  return mix(1.0, lumiTetraRadius(d, q) * uMorphNormTetra, v / 4.0);
  if (v < 6.0)  return mix(lumiTetraRadius(d, q) * uMorphNormTetra,
                           lumiCubeRadius(d, q) * uMorphNormCube, (v - 4.0) / 2.0);
  if (v < 8.0)  return mix(lumiCubeRadius(d, q) * uMorphNormCube,
                           lumiOctaRadius(d, q) * uMorphNormOcta, (v - 6.0) / 2.0);
  if (v < 12.0) return mix(lumiOctaRadius(d, q) * uMorphNormOcta,
                           lumiDodecaRadius(d, q) * uMorphNormDodeca, (v - 8.0) / 4.0);
  if (v < 20.0) return mix(lumiDodecaRadius(d, q) * uMorphNormDodeca,
                           lumiIcosaRadius(d, q) * uMorphNormIcosa, (v - 12.0) / 8.0);
  return lumiIcosaRadius(d, q) * uMorphNormIcosa;
}

// Each solid's normal is exact; a blend mixes the two. That approximates the
// blended surface's true normal, but it is exact on every rung and smooth in
// between, which is all the transitional states need.
vec3 lumiSidesNormal(vec3 d, float v, float q) {
  if (v <= 0.0) return d;
  if (v < 4.0)  return normalize(mix(d, normalize(lumiTetraNormal(d, q)), v / 4.0));
  if (v < 6.0)  return normalize(mix(normalize(lumiTetraNormal(d, q)),
                                     normalize(lumiCubeNormal(d, q)), (v - 4.0) / 2.0));
  if (v < 8.0)  return normalize(mix(normalize(lumiCubeNormal(d, q)),
                                     normalize(lumiOctaNormal(d, q)), (v - 6.0) / 2.0));
  if (v < 12.0) return normalize(mix(normalize(lumiOctaNormal(d, q)),
                                     normalize(lumiDodecaNormal(d, q)), (v - 8.0) / 4.0));
  if (v < 20.0) return normalize(mix(normalize(lumiDodecaNormal(d, q)),
                                     normalize(lumiIcosaNormal(d, q)), (v - 12.0) / 8.0));
  return normalize(lumiIcosaNormal(d, q));
}

vec3 lumiMorphPos(vec3 dir) {
  return dir * lumiSidesRadius(dir, uMorphSides, max(uMorphSharp, 1.0)) * uMorphScale;
}

vec3 lumiMorphNormal(vec3 dir) {
  return lumiSidesNormal(dir, uMorphSides, max(uMorphSharp, 1.0));
}

// Both are mixed by uMorphOn so every other shape passes through untouched.
vec3 lumiMorphApplyPos(vec3 pos) {
  return mix(pos, lumiMorphPos(normalize(pos)), uMorphOn);
}
vec3 lumiMorphApplyNormal(vec3 pos, vec3 nrm) {
  return normalize(mix(nrm, lumiMorphNormal(normalize(pos)), uMorphOn));
}
`;

// ---------------------------------------------------------------------------
// The same axis maths as the GLSL, in JS. Used only to compute the size
// normalisers — evaluating each solid's radius along its own corner direction,
// so 1/that rescales it to circumradius 1. Kept here so each solid's normals
// have a single home; adding one means adding it to both halves of this file.

const PHI = 1.6180339887;
const R3 = 0.5773502692;
const VA = 0.5257311121;
const VB = 0.8506508084;

const TETRA = [[R3, R3, R3], [R3, -R3, -R3], [-R3, R3, -R3], [-R3, -R3, R3]];
const CUBE = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const OCTA = [[R3, R3, R3], [R3, R3, -R3], [R3, -R3, R3], [R3, -R3, -R3]];
const DODECA = [[0, VA, VB], [0, VA, -VB], [VA, VB, 0], [VA, -VB, 0], [VB, 0, VA], [-VB, 0, VA]];
const ICOSA = [
  [R3, R3, R3], [R3, R3, -R3], [R3, -R3, R3], [R3, -R3, -R3],
  [0, R3 / PHI, R3 * PHI], [0, R3 / PHI, -R3 * PHI],
  [R3 / PHI, R3 * PHI, 0], [R3 / PHI, -R3 * PHI, 0],
  [R3 * PHI, 0, R3 / PHI], [-R3 * PHI, 0, R3 / PHI],
];

// Corner (circumradius) directions — a vertex of each solid. A tetrahedron's
// vertices sit opposite its faces, hence the negated triple.
const norm3 = (v) => { const n = Math.hypot(...v); return v.map((c) => c / n); };
const CORNERS = {
  tetra: [-R3, -R3, -R3],
  cube: [R3, R3, R3],
  octa: [1, 0, 0],
  dodeca: [R3, R3, R3],
  icosa: norm3([0, 1, PHI]),
};

// `signed` mirrors the shader's max(dot, 0); symmetric sets fold with |dot|.
const radiusAlong = (axes, d, q, signed) => {
  const terms = axes.map((n) => {
    const dp = n[0] * d[0] + n[1] * d[1] + n[2] * d[2];
    return signed ? Math.max(dp, 0) : Math.abs(dp);
  });
  const m = Math.max(...terms);
  if (m <= 0) return 1;
  const s = terms.reduce((acc, v) => acc + Math.pow(v / m, q), 0);
  return 1 / (m * Math.pow(s, 1 / q));
};

/** Scale factors putting every solid at circumradius 1, for this exponent. */
export function morphNormalisers(sharp) {
  const q = Math.max(sharp, 1);
  return {
    tetra: 1 / radiusAlong(TETRA, CORNERS.tetra, q, true),
    cube: 1 / radiusAlong(CUBE, CORNERS.cube, q, false),
    octa: 1 / radiusAlong(OCTA, CORNERS.octa, q, false),
    dodeca: 1 / radiusAlong(DODECA, CORNERS.dodeca, q, false),
    icosa: 1 / radiusAlong(ICOSA, CORNERS.icosa, q, false),
  };
}

// `sides` is the face count: 0 sphere, 4 pyramid, 6 cube, 8 octahedron,
// 12 dodecahedron, 20 gem. Numbers off those rungs are blends of the two
// solids either side, so the range reads as one continuous family.
export const MORPH_DEFAULTS = { sides: 20, sharp: 60, scale: 1.1 };
// The exponent has to run well past 24: faces only read properly flat once a
// face's dominant term swamps its neighbours, which for the icosahedron's
// 41.8-degree face spacing is around 50+. Below that the solid looks inflated
// rather than cut.
export const MORPH_SHARP_RANGE = [2, 120];
// Bounds of the ladder, for anything driving `sides` as a continuous value
// (setMorph, a tweened transition) rather than picking a rung.
export const MORPH_SIDES_RANGE = [0, 20];

// Camera fit margin over `scale` — the base geometry's bounding sphere
// describes the undeformed icosphere, not the morphed solid. With every solid
// normalised to circumradius 1, `scale` *is* the radius.
export const MORPH_BOUND_FACTOR = 1.04;
