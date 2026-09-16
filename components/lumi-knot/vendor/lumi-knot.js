// ⚠️  VENDORED — DO NOT EDIT.
// Copied from numa-lumi-branding/lumi-knot.js @ 0c2ea6e9950f
// by scripts/sync-lumi-knot.mjs. Change it upstream and re-run the script.
// Codemods applied:
//   · matcap served from /public — upstream loads it relative to the page
//   · frame loop holds its rAF id and stops once disposed
//   · frame loop reschedules through the held id
//   · dispose(): stop the loop and release every GPU resource createKnot made

// The holographic metal knot — Lumi's 3D presence.
//
// A torus knot whose surface is displaced by simplex noise (see
// lumi-knot-states.js for the GLSL and the per-state motion presets). Two
// interchangeable materials produce the metallic-rainbow look:
//
//   pbr    — MeshPhysicalMaterial, metalness 1 + iridescence, lit by three's
//            procedural RoomEnvironment. True angle-dependent rainbow.
//   matcap — MeshMatcapMaterial with the baked holographic-chrome matcap in
//            assets/. The "render" look from the mock, ~free on the GPU, and
//            the variant that ports easiest to React Native later.
//
// Exposes one DialKit target shaped like lumi-orb.js's, so lumi-dials.js picks
// it up through window.__lumiShaders.extraTargets unchanged.

import * as THREE from "three";
import {
  STATES, STATE_PRESETS, tickTowards,
  NOISE_GLSL, DISPLACE_GLSL, RAINBOW_GLSL, RAINBOW_APPLY_GLSL,
} from "./lumi-knot-states.js";
import {
  MORPH_GLSL, MORPH_DEFAULTS, MORPH_BOUND_FACTOR,
  MORPH_SHARP_RANGE, MORPH_SIDES_RANGE, morphNormalisers,
} from "./lumi-knot-morph.js";

// A studio for chrome: dark void + one white key + colored light strips. The
// PBR material's rainbow comes almost entirely from here — a neutral env (e.g.
// three's RoomEnvironment) leaves the metal plain white. Rendered once into a
// PMREM env map at startup.
function makeHoloEnvironment({ hueShift = 0, satMul = 1, accentMul = 1 } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const hsl = {};
  const strip = (color, intensity, pos, rot, scale, isAccent = false) => {
    const mat = new THREE.MeshBasicMaterial({ color });
    if (isAccent) {
      // The env dials only touch the colored strips — the white surround is
      // what keeps the metal silver and should stay put.
      mat.color.getHSL(hsl);
      mat.color.setHSL((hsl.h + hueShift / 360 + 1) % 1, Math.min(1, hsl.s * satMul), hsl.l);
      intensity *= accentMul;
    }
    mat.color.multiplyScalar(intensity);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.scale.set(...scale);
    scene.add(mesh);
  };
  // White surround first — most of the sphere should be bright so the chrome
  // reads silver, with the colored strips as accents on top of it.
  strip(0xffffff, 1.1, [0, 0, -5], [0, 0, 0], [10, 8, 1]);                // back wall
  strip(0xffffff, 1.1, [0, 0, 5], [0, Math.PI, 0], [10, 8, 1]);           // front wall
  strip(0xffffff, 0.8, [-5, 0, 0], [0, Math.PI / 2, 0], [10, 8, 1]);      // left wall
  strip(0xffffff, 0.8, [5, 0, 0], [0, -Math.PI / 2, 0], [10, 8, 1]);      // right wall
  strip(0xffffff, 0.4, [0, -5, 0], [-Math.PI / 2, 0, 0], [10, 10, 1]);    // floor
  strip(0xffffff, 7.0, [0, 4, 0], [Math.PI / 2, 0, 0], [6, 2.2, 1]);      // key, overhead
  // Dark horizon band — chrome needs blacks to read as metal, not plastic.
  strip(0x000000, 1.0, [0, -0.6, -4.6], [0, 0, 0.06], [11, 1.4, 1]);
  strip(0x000000, 1.0, [0, -0.4, 4.6], [0, Math.PI, -0.08], [11, 1.2, 1]);
  // Colored accents, pulled closer than the walls so they stay crisp.
  strip(0xff3ecf, 5.0, [-3.5, 0.5, 0], [0, Math.PI / 2, 0.4], [1.8, 4.5, 1], true); // magenta
  strip(0x35ccff, 5.0, [3.5, 0.5, 0], [0, -Math.PI / 2, -0.4], [1.8, 4.5, 1], true);// cyan
  strip(0xffd429, 4.0, [0, -3, 3], [-1.2, 0, 0.5], [3.5, 1.0, 1], true);            // amber
  strip(0x8f2fff, 4.0, [-2, 2.5, -3], [0, 0.5, 0.8], [2.8, 1.0, 1], true);          // violet
  strip(0x2fff8f, 3.5, [2.5, -1, -3], [0, -0.4, -0.6], [2.2, 0.8, 1], true);        // green
  return scene;
}

const DEFAULTS = {
  state: "idle",
  material: "matcap",
  size: 227,
  speed: 1.92,
  opacity: 1,
  offsetX: 0,
  offsetY: 0,
  // knot shape now lives in STATE_PRESETS — each state carries its own.
  rainbow: { strength: 0.86, hue: 0.72, spread: 3.2, fresnel: 0.85, freq: 1.56, sat: 0.89 },
  pbr: { roughness: 0.34, iridescence: 1, iridescenceIOR: 2.28, envIntensity: 0.6 },
  env: { hueShift: 0, satMul: 1, accentMul: 1 },
};


// Which material properties are worth a dial, and over what range. The panel
// is built by walking this list against the *live* material and keeping the
// properties that material actually has — so a glass gets transmission/ior/
// dispersion, velvet gets sheen, and matcap gets almost nothing, with no
// per-material config written by hand. Adding a material to
// lumi-knot-materials.js gives it the right dials automatically.
// `needs` gates the satellite knobs on the feature that switches them on.
// Several MeshPhysicalMaterial properties default to a non-zero value while
// their parent effect is off — sheenRoughness is 1 with sheen at 0, ior is 1.5
// with no transmission — so a plain "is it non-zero" test would put a row of
// dead controls on every glass and metal.
const MATERIAL_PARAMS = [
  { key: "roughness", range: [0, 1, 0.01], always: true },
  { key: "metalness", range: [0, 1, 0.01] },
  { key: "transmission", range: [0, 1, 0.01] },
  { key: "thickness", range: [0, 5, 0.05], needs: "transmission" },
  { key: "ior", range: [1, 2.333, 0.01], needs: "transmission" },
  { key: "dispersion", range: [0, 2, 0.01], needs: "transmission" },
  { key: "attenuationDistance", range: [0.05, 5, 0.05], needs: "transmission" },
  { key: "iridescence", range: [0, 1, 0.01] },
  { key: "iridescenceIOR", range: [1, 2.333, 0.01], needs: "iridescence" },
  { key: "clearcoat", range: [0, 1, 0.01] },
  { key: "clearcoatRoughness", range: [0, 1, 0.01], needs: "clearcoat" },
  { key: "sheen", range: [0, 1, 0.01] },
  { key: "sheenRoughness", range: [0, 1, 0.01], needs: "sheen" },
  { key: "anisotropy", range: [0, 1, 0.01] },
  { key: "specularIntensity", range: [0, 2, 0.01] },
  { key: "envMapIntensity", range: [0, 4, 0.05], always: true },
  { key: "opacity", range: [0, 1, 0.01], always: true },
];

// A property earns a dial if the material carries it and it is doing something
// (or is one of the always-useful few). Showing every property on every
// material is how the old panel ended up full of controls that did nothing.
function materialGroup(material) {
  const group = { _collapsed: false };
  if (material.color) group.color = { type: "color", default: `#${material.color.getHexString()}` };
  for (const { key, range, always, needs } of MATERIAL_PARAMS) {
    const v = material[key];
    if (typeof v !== "number") continue;
    if (needs && !material[needs]) continue;
    if (!always && !needs && v === 0) continue;
    group[key] = [v, range[0], range[1], range[2]];
  }
  if (material.attenuationColor && material.transmission) {
    group.attenuationColor = { type: "color", default: `#${material.attenuationColor.getHexString()}` };
  }
  return group;
}

// Cached per (state, shape, material) — DialKit diffs configs by reference, so
// the same context must always hand back the same object.
const configCache = new Map();

/**
 * The panel is contextual: it shows the knot's p/q only while the knot is the
 * active shape, the morph's sides only on the morph solid, and the parameters
 * of whichever material is selected. Previously every group was shown on every
 * combination, so most of the panel was inert at any given moment.
 */
function buildConfig({ state: stateKey, shape: shapeKey, material: materialKey }, ctx) {
  const cacheKey = `${stateKey}|${shapeKey}|${materialKey}`;
  const cached = configCache.get(cacheKey);
  if (cached) return cached;

  const preset = STATE_PRESETS[stateKey];
  // Motion seeds from the state preset *merged with* the shape's own floors, so
  // the numbers on screen are the ones actually driving the object. The floors
  // used to be re-applied after the dials on every frame, which silently
  // overrode anything you dragged on a non-knot shape.
  const shapeMotion = ctx.shapeMotion(shapeKey);
  const m = (k, fallback = 0) => shapeMotion[k] ?? preset[k] ?? fallback;
  const motion = { _collapsed: false };
  motion.rotSpeedX = [m("rotSpeedX"), 0, 2, 0.01];
  motion.rotSpeedY = [m("rotSpeedY"), 0, 2, 0.01];
  motion.rotSpeedZ = [m("rotSpeedZ"), 0, 2, 0.01];
  motion.noiseAmp = [m("noiseAmp"), 0, 1, 0.005];
  motion.noiseFreq = [m("noiseFreq", 1), 0.1, 6, 0.05];
  motion.noiseSpeed = [m("noiseSpeed"), 0, 5, 0.01];
  motion.pulseAmp = [m("pulseAmp"), 0, 0.3, 0.005];
  motion.pulseHz = [m("pulseHz"), 0, 4, 0.05];
  motion.wobbleAmp = [m("wobbleAmp"), 0, 0.8, 0.01];
  motion.wobbleHz = [m("wobbleHz"), 0, 2, 0.01];
  motion.twistAmp = [m("twistAmp"), 0, 2, 0.01];
  motion.twistHz = [m("twistHz"), 0, 2, 0.01];
  motion.floatAmp = [m("floatAmp"), 0, 0.4, 0.005];
  motion.floatHz = [m("floatHz"), 0, 2, 0.01];

  // --- Form: only the knobs the active shape actually responds to. ---
  const form = { _collapsed: false };
  if (shapeKey === "knot") {
    form.p = [preset.knot.p, 1, 5, 1];
    form.q = [preset.knot.q, 1, 7, 1];
    form.tube = [preset.knot.tube, 0.05, 0.8, 0.01];
  } else if (shapeKey === "morph") {
    // Whole numbers only, 0–20. The named solids sit on 0, 4, 6, 8, 12 and 20;
    // the integers between them are genuine blends of the two either side, so
    // stepping through the range sweeps the whole family rather than jumping
    // between six presets.
    form.sides = [MORPH_DEFAULTS.sides, MORPH_SIDES_RANGE[0], MORPH_SIDES_RANGE[1], 1];
    // Time to glide between solids. 0 snaps, which is the old behaviour.
    form.morphMs = [220, 0, 2000, 10];
    form.facet = [MORPH_DEFAULTS.sharp, MORPH_SHARP_RANGE[0], MORPH_SHARP_RANGE[1], 0.5];
    form.scale = [MORPH_DEFAULTS.scale, 0.3, 1.6, 0.01];
  }
  // Squash rides the rig, so it works on every shape.
  form.squash = [preset.knot.squash, 0.4, 1.6, 0.01];

  const config = {
    // --- What am I looking at ---
    shape: { type: "select", options: ctx.shapeOptions(), default: shapeKey },
    material: { type: "select", options: ctx.materialOptions(), default: materialKey },
    state: { type: "select", options: STATES, default: stateKey },

    // --- Where it sits ---
    placement: {
      _collapsed: true,
      size: [DEFAULTS.size, 60, 380, 1],
      opacity: [DEFAULTS.opacity, 0, 1, 0.01],
      offsetX: [DEFAULTS.offsetX, -180, 180, 1],
      offsetY: [DEFAULTS.offsetY, -320, 320, 1],
    },

    // Group keys carry their context on purpose: DialKit keeps values for
    // same-named keys when the config reshapes, so a shared name would drag the
    // previous context's numbers along instead of reseeding. Distinct names =
    // fresh seed per context, and your tweaks come back when you return to it.
    [`form_${shapeKey}`]: form,
    [`motion_${stateKey}_${shapeKey}`]: motion,
    [`material_${materialKey}`]: materialGroup(ctx.material(materialKey)),

    rainbow: {
      _collapsed: true,
      strength: [DEFAULTS.rainbow.strength, 0, 1, 0.01],
      hue: [DEFAULTS.rainbow.hue, 0, 1, 0.01],
      spread: [DEFAULTS.rainbow.spread, 0, 4, 0.05],
      fresnel: [DEFAULTS.rainbow.fresnel, 0.3, 6, 0.05],
      freq: [DEFAULTS.rainbow.freq, 0, 2, 0.01],
      sat: [DEFAULTS.rainbow.sat, 0, 1, 0.01],
    },
    // Rebakes whichever studio the active material brought with it.
    environment: {
      _collapsed: true,
      hueShift: [DEFAULTS.env.hueShift, -180, 180, 1],
      sat: [DEFAULTS.env.satMul, 0, 2, 0.01],
      accent: [DEFAULTS.env.accentMul, 0, 3, 0.05],
    },

    // --- Playback ---
    speed: [DEFAULTS.speed, 0, 4, 0.01],
    paused: false,
    copyKnot: { type: "action", label: "Copy knot settings" },
  };
  configCache.set(cacheKey, config);
  return config;
}

/** Builds the knot inside `host` and returns `{ target, setState }`. */
/**
 * @param {HTMLElement} host
 * @param {{
 *   extraMaterials?: Record<string, { make: (THREE) => THREE.Material, rainbow?: number }>,
 *   extraShapes?: Record<string, { make: (THREE) => THREE.BufferGeometry, motion?: object }>,
 * }} [options]
 *   extraMaterials — additional material presets, keyed by the name the dials'
 *   select shows. `rainbow` scales the holographic overlay for that material
 *   (1 = same as chrome, 0 = none).
 *   extraShapes — alternative geometries (see lumi-knot-shapes.js); "knot"
 *   stays the state-driven torus knot. A shape's `motion` merges over each
 *   state preset while that shape is active.
 */
export function createKnot(host, { extraMaterials = {}, extraShapes = {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, (typeof devicePixelRatio !== "undefined" && devicePixelRatio) || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = "lumi-knot-canvas";
  // prepend, not append — the host may already hold copy that belongs *below*
  // the knot and should move with it (same as lumi-orb.js).
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);

  // The camera backs off to whatever distance fits the knot's bounding sphere
  // (plus its current displacement and pulse) inside the square canvas — a
  // fixed distance clips as soon as the dials pick a wider p/q knot.
  let boundRadius = 1;
  const FIT_MARGIN = 1.06;
  function fitCamera(noiseAmp, pulseAmp, floatAmp = 0) {
    const stretch = Math.max(1, view.knot.squash);
    // The morph reshapes vertices in the shader, so the geometry's own bounding
    // sphere (an undeformed icosphere) understates the solid — a cube's corners
    // reach sqrt(3) past its faces. Derive the radius from the dials instead.
    const base = activeShape === "morph"
      ? sharedUniforms.uMorphScale.value * MORPH_BOUND_FACTOR
      : boundRadius;
    const r = (base + noiseAmp + floatAmp) * (1 + pulseAmp) * stretch * FIT_MARGIN;
    camera.position.z = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  }

  const pmrem = new THREE.PMREMGenerator(renderer);

  // The env map is baked, so the env dials trigger a rebake — it's a handful of
  // planes through PMREM, cheap enough to redo on a debounce.
  let envTexture = null;
  function bakeEnv(params) {
    const next = pmrem.fromScene(makeHoloEnvironment(params), 0.05).texture;
    scene.environment = next;
    envTexture?.dispose();
    envTexture = next;
  }
  bakeEnv(DEFAULTS.env);

  // One uniforms object shared by both materials, so the render loop and the
  // dials write time/noise/rainbow once regardless of which material is active.
  const sharedUniforms = {
    uTime: { value: 0 },
    uNoiseAmp: { value: STATE_PRESETS[DEFAULTS.state].noiseAmp },
    uNoiseFreq: { value: STATE_PRESETS[DEFAULTS.state].noiseFreq },
    uTwist: { value: 0 },
    uRainbowStrength: { value: DEFAULTS.rainbow.strength },
    uRainbowHue: { value: DEFAULTS.rainbow.hue },
    uRainbowSpread: { value: DEFAULTS.rainbow.spread },
    uRainbowFresnel: { value: DEFAULTS.rainbow.fresnel },
    uRainbowFreq: { value: DEFAULTS.rainbow.freq },
    uRainbowSat: { value: DEFAULTS.rainbow.sat },
    // Morph — only bites while the "morph" shape is active (uMorphOn = 1).
    uMorphOn: { value: 0 },
    uMorphSides: { value: MORPH_DEFAULTS.sides },
    uMorphSharp: { value: MORPH_DEFAULTS.sharp },
    uMorphScale: { value: MORPH_DEFAULTS.scale },
    uMorphNormTetra: { value: 1 },
    uMorphNormCube: { value: 1 },
    uMorphNormOcta: { value: 1 },
    uMorphNormDodeca: { value: 1 },
    uMorphNormIcosa: { value: 1 },
  };

  // The morph dials feed a target, and the frame loop glides the live values
  // towards it — so changing solid animates the shape through the blends in
  // between instead of snapping. The shader already takes a fractional `sides`
  // (that is what makes 10 a real halfway form between 8 and 12), so this is
  // purely a matter of easing the uniform rather than assigning it.
  //
  // `primed` snaps on the very first apply: on load the dials arrive holding
  // persisted values, and animating up to them from the defaults would look
  // like the panel was fighting itself.
  const morphState = {
    target: { sides: MORPH_DEFAULTS.sides, facet: MORPH_DEFAULTS.sharp, scale: MORPH_DEFAULTS.scale },
    live: { sides: MORPH_DEFAULTS.sides, facet: MORPH_DEFAULTS.sharp, scale: MORPH_DEFAULTS.scale },
    halflife: 0.22,
    primed: false,
  };

  // The normalisers only depend on the sharpness exponent, so they are a CPU
  // job done once per change rather than per vertex.
  function syncMorphSharp(sharp) {
    sharedUniforms.uMorphSharp.value = sharp;
    const n = morphNormalisers(sharp);
    sharedUniforms.uMorphNormTetra.value = n.tetra;
    sharedUniforms.uMorphNormCube.value = n.cube;
    sharedUniforms.uMorphNormOcta.value = n.octa;
    sharedUniforms.uMorphNormDodeca.value = n.dodeca;
    sharedUniforms.uMorphNormIcosa.value = n.icosa;
  }
  syncMorphSharp(MORPH_DEFAULTS.sharp);

  // Materials that want less (or no) rainbow overlay get their own strength
  // uniform, kept in step with the shared dial each frame.
  const rainbowScaled = [];
  function injectMorph(material, rainbowScale = 1) {
    const scaled = rainbowScale === 1 ? null : { value: sharedUniforms.uRainbowStrength.value * rainbowScale };
    if (scaled) rainbowScaled.push({ uniform: scaled, scale: rainbowScale });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, sharedUniforms);
      if (scaled) shader.uniforms.uRainbowStrength = scaled;
      // Order matters: the morph reshapes the base sphere first, then the noise
      // displacement and twist run on top of the morphed surface — so a
      // faceted gem can still breathe and wring without the noise being
      // sampled against the undeformed sphere.
      shader.vertexShader = shader.vertexShader
        .replace("void main() {", `${NOISE_GLSL}\n${MORPH_GLSL}\n${DISPLACE_GLSL}\nvarying vec3 vLumiPos;\nvoid main() {`)
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
vec3 lumiNPos = lumiMorphApplyPos(position);
objectNormal = lumiMorphApplyNormal(position, objectNormal);
objectNormal = lumiPerturbNormal(lumiNPos, objectNormal);
objectNormal.xz = lumiTwistRot(objectNormal.xz, lumiNPos.y);`
        )
        .replace(
          "#include <begin_vertex>",
          `vec3 lumiVPos = lumiMorphApplyPos(position);
vec3 lumiVNrm = lumiMorphApplyNormal(position, normal);
vec3 transformed = lumiDisplace(lumiVPos, lumiVNrm);
transformed.xz = lumiTwistRot(transformed.xz, lumiVPos.y);
vLumiPos = transformed;`
        );
      if (!shader.fragmentShader.includes("#include <opaque_fragment>")) {
        console.warn("lumi-knot: opaque_fragment chunk not found — rainbow overlay skipped (three version change?)");
        return;
      }
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", `${RAINBOW_GLSL}\nvoid main() {`)
        .replace("#include <opaque_fragment>", `${RAINBOW_APPLY_GLSL}\n#include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => "lumi-morph";
    return material;
  }

  const matcapTexture = new THREE.TextureLoader().load("/lumi-knot/matcap-holo.png");
  matcapTexture.colorSpace = THREE.SRGBColorSpace;

  const materials = {
    matcap: injectMorph(new THREE.MeshMatcapMaterial({ matcap: matcapTexture })),
    pbr: injectMorph(new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: DEFAULTS.pbr.roughness,
      iridescence: DEFAULTS.pbr.iridescence,
      iridescenceIOR: DEFAULTS.pbr.iridescenceIOR,
      envMapIntensity: DEFAULTS.pbr.envIntensity,
    })),
  };
  // The matcap is already a lit "photo" of a material — tone mapping it again
  // just dims the bake.
  materials.matcap.toneMapped = false;

  for (const [key, def] of Object.entries(extraMaterials)) {
    materials[key] = injectMorph(def.make(THREE), def.rainbow ?? 1);
  }
  // A material def can carry its own environment (envScene: (THREE, params) =>
  // Scene) — swapped in while that material is active, baked once per builder.
  // The env dials clear this cache so they reach these studios too, not just
  // the default holo one.
  const envBakes = new Map();
  function syncEnvironment() {
    const builder = extraMaterials[view.material]?.envScene;
    if (!builder) { scene.environment = envTexture; return; }
    if (!envBakes.has(builder)) {
      envBakes.set(builder, pmrem.fromScene(builder(THREE, view.env), 0.05).texture);
    }
    scene.environment = envBakes.get(builder);
  }
  // The scene is env-lit only; materials that don't read env maps (toon)
  // flag `lights: true` and get a simple key + fill. v6 passes no extras, so
  // its look is unchanged.
  if (Object.values(extraMaterials).some((d) => d.lights)) {
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 3, 4);
    scene.add(key, new THREE.HemisphereLight(0xffffff, 0xffc9d2, 1.2));
  }

  function makeGeometry({ p, q, tube }) {
    // High tubular resolution so the noise displacement stays smooth.
    const geo = new THREE.TorusKnotGeometry(1, tube, 320, 56, Math.round(p), Math.round(q));
    geo.computeBoundingSphere();
    boundRadius = geo.boundingSphere.radius;
    return geo;
  }

  // The mesh spins inside a rig: the rig carries the wobble tilt and the
  // squash, so they read in screen space instead of tumbling with the knot.
  const mesh = new THREE.Mesh(makeGeometry(STATE_PRESETS[DEFAULTS.state].knot), materials[DEFAULTS.material]);
  const rig = new THREE.Group();
  rig.add(mesh);
  scene.add(rig);

  let envTimer = 0;
  const view = {
    state: DEFAULTS.state,
    material: DEFAULTS.material,
    size: DEFAULTS.size,
    speed: DEFAULTS.speed,
    paused: false,
    knot: { ...STATE_PRESETS[DEFAULTS.state].knot },
    env: { ...DEFAULTS.env },
    // `target` is what the dials/state ask for; `live` glides towards it.
    target: { ...STATE_PRESETS[DEFAULTS.state] },
    live: { ...STATE_PRESETS[DEFAULTS.state] },
  };

  let lastSize = 0;
  function layout(size) {
    if (size === lastSize) return;
    lastSize = size;
    renderer.setSize(size, size, false);
    renderer.domElement.style.width = `${size}px`;
    renderer.domElement.style.height = `${size}px`;
  }

  let prevNow = performance.now();
  let pulseT = 0;
  let wobbleT = 0;
  let twistT = 0;
  let floatT = 0;
  let __rafId = 0;
  let __disposed = false;
  function frame() {
    if (__disposed) return;
    // Never let a bad frame break the rAF chain (see lumi-orb.js:146).
    try {
      const now = performance.now();
      const dt = Math.min(0.1, (now - prevNow) / 1000);
      prevNow = now;

      layout(view.size);

      if (!view.paused) {
        const speed = view.speed;
        tickTowards(view.live, view.target, dt);
        const p = view.live;

        sharedUniforms.uTime.value += dt * p.noiseSpeed * speed;
        sharedUniforms.uNoiseAmp.value = p.noiseAmp;
        sharedUniforms.uNoiseFreq.value = p.noiseFreq;

        mesh.rotation.x += dt * p.rotSpeedX * speed;
        mesh.rotation.y += dt * p.rotSpeedY * speed;
        mesh.rotation.z += dt * p.rotSpeedZ * speed;

        pulseT += dt * p.pulseHz * speed;
        const s = 1 + p.pulseAmp * Math.sin(pulseT * Math.PI * 2);
        mesh.scale.setScalar(s);

        // Precession: tilt circles around at wobbleHz. The 0.77 detunes the
        // two axes so the tilt traces a drifting loop instead of a fixed ring.
        wobbleT += dt * p.wobbleHz * speed;
        rig.rotation.x = p.wobbleAmp * Math.sin(wobbleT * Math.PI * 2);
        rig.rotation.z = p.wobbleAmp * Math.cos(wobbleT * Math.PI * 2 * 0.77);

        twistT += dt * p.twistHz * speed;
        sharedUniforms.uTwist.value = p.twistAmp * Math.sin(twistT * Math.PI * 2);

        // Bob. On the rig, not the mesh, so it stays vertical on screen
        // instead of tumbling with the body (same reasoning as the wobble).
        floatT += dt * p.floatHz * speed;
        rig.position.y = (p.floatAmp || 0) * Math.sin(floatT * Math.PI * 2);
      }

      // Outside the pause guard so knot-shape dials respond even while paused —
      // the morph glide included, so you can watch a shape change with the
      // motion stopped.
      tickTowards(morphState.live, morphState.target, dt, morphState.halflife);
      sharedUniforms.uMorphSides.value = morphState.live.sides;
      sharedUniforms.uMorphScale.value = morphState.live.scale;
      if (Math.abs(morphState.live.facet - sharedUniforms.uMorphSharp.value) > 1e-4) {
        syncMorphSharp(morphState.live.facet);
      }

      rig.scale.y = view.knot.squash;
      fitCamera(view.live.noiseAmp, view.live.pulseAmp, Math.abs(rig.position.y));

      for (const r of rainbowScaled) r.uniform.value = sharedUniforms.uRainbowStrength.value * r.scale;
      renderer.render(scene, camera);
    } catch (e) {
      console.error("Lumi knot frame failed:", e);
    }
    if (!__disposed) __rafId = requestAnimationFrame(frame);
  }
  __rafId = requestAnimationFrame(frame);

  function applyKnot(k) {
    const rebuild = k.p !== view.knot.p || k.q !== view.knot.q || k.tube !== view.knot.tube;
    view.knot = { ...k }; // squash is applied per-frame, no rebuild needed
    // While a custom shape is active, the p/q values only book-keep; the
    // geometry belongs to the shape.
    if (rebuild && activeShape === "knot") swapGeometry(makeGeometry(view.knot));
  }

  function swapGeometry(geo) {
    const old = mesh.geometry;
    mesh.geometry = geo;
    geo.computeBoundingSphere();
    boundRadius = geo.boundingSphere.radius;
    old.dispose();
  }

  // ---- Alternative shapes (v7's shape picker) ----
  let activeShape = "knot";
  function setShape(key) {
    if (key === activeShape) return;
    if (key !== "knot" && !extraShapes[key]) return;
    activeShape = key;
    sharedUniforms.uMorphOn.value = key === "morph" ? 1 : 0;
    if (key === "knot") {
      swapGeometry(makeGeometry(view.knot));
    } else {
      swapGeometry(extraShapes[key].make(THREE));
    }
    setState(view.state); // re-seed motion so the shape's floors apply/clear
    emitChange();
  }

  function setState(stateKey) {
    const preset = STATE_PRESETS[stateKey];
    if (!preset) return;
    view.state = stateKey;
    // Motion glides via the tween; the knot shape swaps outright (you can't
    // tween a winding count). The shape's floors merge over the state preset
    // here, at seed time — never after the dials, which is what used to make
    // every motion dial inert on a non-knot shape.
    const { knot, ...motion } = preset;
    Object.assign(view.target, motion, shapeMotionFor(activeShape));
    if (knot) applyKnot(knot);
    emitChange();
  }

  function shapeMotionFor(key) {
    return (key !== "knot" && extraShapes[key]?.motion) || {};
  }

  // Shape/material/state can now be driven from the panel, the page's own
  // switchers, or the chat flow. Listeners let those surfaces re-label
  // themselves instead of drifting out of sync with the object.
  const changeListeners = new Set();
  function emitChange() {
    const snap = { shape: activeShape, material: view.material, state: view.state };
    for (const cb of changeListeners) { try { cb(snap); } catch (e) { console.error(e); } }
  }

  // The panel mounts late and re-fires apply() on every render, so anything set
  // programmatically (setShape/setMaterial/setState from the flow) would be
  // stomped by whatever the select last held. Each of these adopts the dial
  // only when the dial itself changed — otherwise the programmatic value wins.
  const dialEcho = { shape: null, material: null, state: null };
  function dialPick(kind, dialValue, current) {
    if (dialEcho[kind] === null) dialEcho[kind] = dialValue; // first mount: trust the object
    if (dialValue !== dialEcho[kind]) {
      dialEcho[kind] = dialValue;
      return dialValue;
    }
    return current;
  }

  function apply(values) {
    const wantShape = dialPick("shape", values.shape, activeShape);
    if (wantShape !== activeShape) setShape(wantShape);

    const wantMat = dialPick("material", values.material, view.material);
    if (materials[wantMat] && wantMat !== view.material) setMaterial(wantMat);

    const wantState = dialPick("state", values.state, view.state);
    if (wantState !== view.state) setState(wantState);

    view.speed = values.speed;
    view.paused = values.paused;

    // Contextual groups. On the render where a select just flipped, the new
    // group isn't in `values` yet (the config swaps on the next render) — skip
    // and let that render apply it.
    const motion = values[`motion_${view.state}_${activeShape}`];
    if (motion) Object.assign(view.target, motion);

    const form = values[`form_${activeShape}`];
    if (form) {
      if (activeShape === "knot") {
        applyKnot({ p: form.p, q: form.q, tube: form.tube, squash: form.squash });
      } else {
        view.knot = { ...view.knot, squash: form.squash };
      }
      if (activeShape === "morph") {
        morphState.target.sides = form.sides;
        morphState.target.scale = form.scale;
        morphState.target.facet = form.facet;
        morphState.halflife = (form.morphMs ?? 220) / 1000;
        // First pass: adopt outright so a persisted value doesn't animate in.
        if (!morphState.primed) {
          morphState.primed = true;
          Object.assign(morphState.live, morphState.target);
        }
      }
    }

    const matValues = values[`material_${view.material}`];
    if (matValues) applyMaterialValues(materials[view.material], matValues);

    const r = values.rainbow;
    sharedUniforms.uRainbowStrength.value = r.strength;
    sharedUniforms.uRainbowHue.value = r.hue;
    sharedUniforms.uRainbowSpread.value = r.spread;
    sharedUniforms.uRainbowFresnel.value = r.fresnel;
    sharedUniforms.uRainbowFreq.value = r.freq;
    sharedUniforms.uRainbowSat.value = r.sat;

    const e = values.environment;
    const env = { hueShift: e.hueShift, satMul: e.sat, accentMul: e.accent };
    if (env.hueShift !== view.env.hueShift || env.satMul !== view.env.satMul || env.accentMul !== view.env.accentMul) {
      view.env = env;
      // Debounced — apply() fires on every dial tick while dragging, and each
      // rebake is a PMREM pass.
      clearTimeout(envTimer);
      envTimer = setTimeout(() => { envBakes.clear(); bakeEnv(view.env); syncEnvironment(); }, 120);
    }

    const p = values.placement;
    view.size = p.size;
    host.style.opacity = p.opacity;
    host.style.transform = `translate(${p.offsetX}px, ${p.offsetY}px)`;
  }

  // Writes the material group's values back onto the live material. Colors come
  // through as hex strings; everything else is a plain number.
  function applyMaterialValues(material, vals) {
    if (!material) return;
    for (const [key, v] of Object.entries(vals)) {
      if (key.startsWith("_")) continue;
      if (typeof v === "string") material[key]?.set?.(v);
      else if (typeof v === "number" && typeof material[key] === "number") material[key] = v;
    }
  }

  function snippet(values) {
    return [
      `// lumi-knot — ${view.state} · ${activeShape} · ${view.material}`,
      `size: ${values.placement.size},  speed: ${values.speed},`,
      `form: ${JSON.stringify(values[`form_${activeShape}`], null, 2)},`,
      `motion: ${JSON.stringify(values[`motion_${view.state}_${activeShape}`], null, 2)},`,
      `material: ${JSON.stringify(values[`material_${view.material}`], null, 2)},`,
      `rainbow: ${JSON.stringify(values.rainbow, null, 2)},`,
      `environment: ${JSON.stringify(values.environment, null, 2)},`,
    ].join("\n");
  }

  /** Switch material by key. The dials adopt it via dialPick, not the reverse. */
  function setMaterial(key) {
    if (!materials[key]) return;
    view.material = key;
    mesh.material = materials[key];
    syncEnvironment();
    emitChange();
  }

  /**
   * Drive the morph outside the dials — `sides` 0 sphere, 4 pyramid, 6 cube…
   * Animates by default; pass `immediate` to jump. Fractional `sides` is valid,
   * so this doubles as the hook for scripting a transition by hand.
   */
  function setMorph({ sides, facet, scale, immediate = false } = {}) {
    if (sides !== undefined) morphState.target.sides = sides;
    if (facet !== undefined) morphState.target.facet = facet;
    if (scale !== undefined) morphState.target.scale = scale;
    if (immediate) Object.assign(morphState.live, morphState.target);
  }

  // What buildConfig needs to know about this instance — the live material for
  // deriving its dials, and the option lists. Passed in rather than reached for
  // globally so the config builder stays a pure function of its context.
  const configCtx = {
    material: (key) => materials[key] ?? materials[DEFAULTS.material],
    materialOptions: () => Object.keys(materials),
    shapeOptions: () => ["knot", ...Object.keys(extraShapes)],
    shapeMotion: shapeMotionFor,
  };
  const contextOf = (values) => ({
    state: values?.state ?? DEFAULTS.state,
    shape: values?.shape ?? "knot",
    material: values?.material ?? DEFAULTS.material,
  });

  return {
    /** Added by scripts/sync-lumi-knot.mjs — stop, free the GPU, drop the canvas. */
    dispose() {
      if (__disposed) return;
      __disposed = true;
      cancelAnimationFrame(__rafId);
      clearTimeout(envTimer);
      changeListeners.clear();
      mesh.geometry.dispose();
      for (const m of Object.values(materials)) m.dispose();
      matcapTexture.dispose();
      envTexture?.dispose();
      for (const t of envBakes.values()) t.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
    setState,
    setMaterial,
    setShape,
    setMorph,
    /** Subscribe to shape/material/state changes. Returns an unsubscribe. */
    onChange(cb) { changeListeners.add(cb); return () => changeListeners.delete(cb); },
    /** Read-only snapshot of what the object is currently being driven towards. */
    snapshot: () => ({
      shape: activeShape,
      material: view.material,
      state: view.state,
      motion: { ...view.target },
      morph: { ...morphState.live },
      morphTarget: { ...morphState.target },
    }),
    materials: () => Object.keys(materials),
    shapes: () => ["knot", ...Object.keys(extraShapes)],
    target: {
      key: "knot",
      label: "Lumi Object",
      config: buildConfig(contextOf(), configCtx),
      // The panel reshapes whenever the shape, material or state changes, so
      // only the controls that bite on the current selection are on screen.
      configFor: (values) => buildConfig(contextOf(values), configCtx),
      apply,
      snippet,
    },
  };
}
