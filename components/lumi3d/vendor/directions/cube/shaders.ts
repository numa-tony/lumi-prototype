// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/cube/shaders.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// GLSL for the Cube direction. All colours arrive as linear uniforms
// (THREE.Color converts hex → linear); every fragment shader that draws to the
// screen ends with <colorspace_fragment> so it is correct both on the canvas
// and inside MeshTransmissionMaterial's linear refraction buffer.
//
// Never pow() a possibly negative base: GLSL leaves it undefined and Apple
// GPUs return NaN, which clamps to black. Gaussians are written as x * x.

const NOISE = /* glsl */ `
  // the background lowers this on phones; the other materials take the default
  #ifndef FBM_OCTAVES
  #define FBM_OCTAVES 4
  #endif
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  // one hash for a band index: the shader and air.ts must agree digit for digit
  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < FBM_OCTAVES; i++) {
      v += a * vnoise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }
  // ±1 LSB triangular-ish dither so soft gradients never band
  vec3 dither(vec2 fc, float seed) {
    return vec3(hash21(fc + seed) + hash21(fc.yx - seed) - 1.0) / 255.0;
  }
`

export const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Summer-morning light through a moving curtain, on Numa's warm canvas.
 *
 * Four layers, in the order the eye reads them. A wide soft leak is the base
 * glow — the deck's prismatic light, and what the picture had before. Over it,
 * a field of fine irregular bands: the pleats, one per cell, each with its own
 * width, brightness and phase, so the set never looks ruled or evenly spaced.
 * The whole set sways sideways on the breeze while each band's brightness
 * travels along its own length, which is the fabric moving relative to the sun
 * and the reason the light shimmers instead of pulsing. And the light lands on
 * a plaster wall rather than on nothing, so it has a surface to shade.
 *
 * Everything runs along uAlong, the screen direction of the one light (see
 * light.ts), so the leak, the studio, the glass and the floor agree about
 * where the light is. The cube bites a shaft out of it — and because the bite
 * multiplies light that is already banded, the shadow arrives striped for
 * free: it can only remove light where there was light. Inside that shaft, on
 * the far side, the glass throws back what it focused, spread into a spectrum
 * that turns as the cube turns.
 */
export const BACKGROUND_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uAspect;
  uniform float uRay;
  uniform float uBase;
  uniform float uBands;
  uniform float uSoft;
  uniform float uReach;
  uniform float uSpectral;
  uniform float uShade;
  uniform float uSpread;
  uniform float uWarm;
  uniform float uAccent;
  uniform vec2 uParallax;
  uniform vec2 uAlong;
  uniform vec2 uAcross;
  uniform float uSway;
  uniform float uShimmer;
  uniform float uShimmerT;
  uniform float uWidthRatio;
  uniform float uJitter;
  uniform float uShimmerScale;
  uniform float uWarpScale;
  uniform float uWarpAmt;
  uniform vec2 uCube;
  uniform float uCubeR;
  uniform float uBite;
  uniform float uFan;
  uniform float uFanTurn;
  uniform float uFanSpread;
  uniform float uRelief;
  uniform float uReliefScale;
  uniform float uSeam;
  uniform float uVignette;
  uniform float uCorner;
  uniform sampler2D uWall;
  uniform vec3 uCanvas;
  uniform vec3 uPink;
  uniform vec3 uCity;
  varying vec2 vUv;
  ${NOISE}

  vec3 spectrum(float h) {
    // pastel r → g → b across 0..1
    vec3 c = vec3(
      1.0 - smoothstep(0.05, 0.5, h),
      1.0 - abs(h - 0.5) * 2.2,
      smoothstep(0.5, 0.95, h)
    );
    return mix(vec3(1.0), clamp(c, 0.0, 1.0), 0.6);
  }

  float beam(float x, float w) {
    float e = x / w;
    return exp(-e * e);
  }

  /**
   * The pleats. Here u is the across-axis in band units; one band lives in each
   * cell, and its width, brightness and shimmer phase all come from the cell's
   * index, so the field is irregular but perfectly repeatable — which is what
   * lets air.ts evaluate the same field on the CPU for the cube's response.
   * The out parameter reports how close the point is to a band's core, so the
   * warmth can sit in the cores only.
   */
  // How many neighbouring cells a point gathers. Guarded like FBM_OCTAVES: a
  // define that only one of the materials sharing this file sets is the exact
  // shape of a shader that compiles until someone reuses the function.
  #ifndef PLEAT_SPAN
  #define PLEAT_SPAN 1
  #endif

  // the field's ordinary level and a band core's, the pair the transmission is
  // normalised between. air.ts holds the same two numbers.
  #define PLEAT_LOW 0.12
  #define PLEAT_HIGH 0.70

  float pleats(float u, float along, out float hot) {
    float sum = 0.0;
    hot = 0.0;
    float i0 = floor(u);
    for (int k = -PLEAT_SPAN; k <= PLEAT_SPAN; k++) {
      float ci = i0 + float(k);
      float hw = hash11(ci);
      float hb = hash11(ci + 71.3);
      float hp = hash11(ci + 131.7);
      float centre = ci + 0.5 + (hp - 0.5) * uJitter;
      // Wider than a first guess suggests. Narrow bands made a field that was
      // 95% gap: measured, only the top few percent of it ever reached a band
      // core, so the wall was almost entirely in shade and the bands never got
      // bright. These widths give a curtain that is open about as much as it is
      // closed.
      float w = mix(0.16, 0.50, hw * hw) * uWidthRatio;
      float d = (u - centre) / w;
      float g = exp(-d * d / max(0.15, uSoft));
      // brightness travelling along the band, each on its own phase, so the
      // set shimmers rather than blinking together
      float sh = sin(along * uShimmerScale - uShimmerT + hp * 6.283);
      // a quarter, not a half: at half the shimmer took a band's brightness
      // down to nothing on every cycle, which reads as blinking rather than as
      // fabric shifting in the light
      float amp = mix(0.4, 1.0, hb) * (1.0 - uShimmer * 0.25 + uShimmer * 0.25 * sh);
      sum += g * amp;
      hot = max(hot, g);
    }
    return sum;
  }

  void main() {
    // p0 is parallax-free: the cube's silhouette is pinned to it, so the shadow
    // stays glued to the cube while the beams drift
    vec2 p0 = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 p = p0 + uParallax * vec2(0.016, 0.011);
    float t = uTime;

    // gentle warp so no edge in the picture is ever a ruled line
    float w = fbm(p * uWarpScale + vec2(t * 0.016, -t * 0.012));
    vec2 q = p + (w - 0.5) * uWarpAmt;
    float across = dot(q, uAcross);
    float along = dot(q, uAlong);
    // bright where the light enters, dissolving away from it
    float len = smoothstep(-0.85 * uReach, 0.55, along + 0.15 * (w - 0.5));

    // --- the cube bites the beam -------------------------------------------
    vec2 rel = p0 - uCube + uAlong * (uCubeR * 1.1);
    float r = max(uCubeR, 1e-3);
    float sAlong = dot(rel, uAlong);
    // the shaft runs away from the light only: stretched on the far side, cut
    // short on the side facing it, so it reads as cast and not as a haze the
    // cube is sitting in the middle of
    float sd = length(vec2(dot(rel, uAcross), sAlong * (sAlong > 0.0 ? 1.9 : 0.5))) / r;
    float shaft = 1.0 - smoothstep(0.5, 1.4, sd);
    float halo = (sd - 1.1) / 0.42;
    float rim = exp(-halo * halo) * smoothstep(0.0, 0.4 * r, -sAlong);
    float occ = 1.0 - shaft * uBite;

    // --- the light itself ---------------------------------------------------
    // the wide leak: the base glow the fine rays sit on
    float b1 = beam(across - 0.07 + 0.03 * sin(t * 0.07), 0.115);
    float b2 = beam(across + 0.21 + 0.02 * sin(t * 0.05 + 1.3), 0.05);
    float b4 = beam(across + 0.55, 0.09) * 0.55 + beam(across - 0.62, 0.07) * 0.4;
    float wide = clamp(b1 * 0.85 + b2 * 0.7 + b4, 0.0, 1.0);
    // the thin beam that carries the spectral seam
    float e3 = (across - 0.255 + 0.015 * sin(t * 0.06 + 2.1)) / 0.032;
    float b3 = exp(-e3 * e3);

    // The fabric does not add light — it takes the beam that arrives and lets
    // some of it through. Adding the bands to the leak instead of modulating it
    // was the whole problem: the leak was brightest exactly where the bands
    // were, so it filled in every gap and the set read as one smooth wash.
    float hot;
    float fine = pleats(across * uBands + uSway, along, hot);
    // The sunlit patch on the wall, and it has to be broad: a window is broad.
    // The three narrow beams the deck's leak was drawn from ride on top of it
    // as accents rather than being the whole of the light — as three gaussians
    // they covered a third of the frame, and the fabric had nothing to break up
    // anywhere else.
    float broad = beam(across - 0.02, uSpread);
    float arrive = clamp(broad * 0.85 + wide * 0.45 + b3 * 0.4, 0.0, 1.0);
    // 1 at a band's core, 0 in the weave between them. A plain divide left a
    // floor of about a half — neighbouring bands' tails always contribute
    // something — so the curtain never actually closed anywhere and every gap
    // stayed half lit. The remap puts the field's ordinary level at zero and
    // its cores at one, which is what makes a band a band.
    float pass = smoothstep(PLEAT_LOW, PLEAT_HIGH, fine);
    // uBase is how much of the beam misses the curtain altogether: at 1 the
    // picture is the smooth leak it used to be, at 0 the fabric owns all of it
    float through = mix(pass, 1.0, clamp(uBase, 0.0, 1.0));
    float light = arrive * through * len * uRay * occ;
    // Where the weave is dense the wall is in its shadow, a little under the
    // canvas and a little cooler. Light can only add, and the whole headroom
    // between this canvas and white is about twelve levels, so without the
    // shading side the bands have nothing to rise from.
    float shade = clamp(1.0 - through, 0.0, 1.0) * arrive * len * uRay * uShade * occ;
    // what actually reaches the cube, before the cube removes any of it. The
    // caustic and the shadow's cool cast are both consequences of *this*, not
    // of what survives — scaling them by the occluded light made each one
    // cancel its own cause.
    float incident = arrive * len * uRay;

    // the wall the light falls on: plaster relief, lit from the one direction.
    // It shades only what the light reaches, so the bare canvas stays flat.
    vec2 n = texture2D(uWall, p0 * uReliefScale).xy * 2.0 - 1.0;
    float relief = 1.0 + dot(n, uAlong) * uRelief;

    vec3 white = vec3(1.02);
    // a summer morning is warmer than the canvas: a breath of gold, in the
    // cores of the bands only, so the picture never turns orange
    vec3 core = mix(white, vec3(1.02, 0.985, 0.93), clamp(uWarm * hot, 0.0, 1.0));
    vec3 pinkish = mix(core, uPink, 0.45);
    vec3 col = uCanvas;
    // the shade first, so the bands are drawn onto a wall that is already
    // carrying the fabric's own shadow
    // the shaded wall is cooler as well as darker: it is lit by the sky the
    // sun is not reaching it through, which is what stops the gaps reading as
    // grey rather than as shadow
    col = mix(col, uCanvas * vec3(0.90, 0.915, 0.945), clamp(shade, 0.0, 1.0));
    col = mix(col, mix(core, pinkish, 0.3 + 0.7 * b1), light * 0.92 * relief);
    // the wide beam carries a soft pink heart
    col = mix(col, pinkish, b1 * len * uRay * 0.2 * occ);
    // what the glass lets through, pooled just outside the shadow
    col = mix(col, white, rim * uBite * len * uRay * 0.1);

    // spectral seam on the upper edge of the thin beam
    float es = (e3 - 1.15) / 0.5;
    float seam = exp(-es * es);
    float hue = clamp((e3 - 0.65) / 1.1, 0.0, 1.0);
    col = mix(col, spectrum(hue), seam * 0.14 * uSeam * uSpectral * uRay * len * occ);

    // --- the cube's own caustic ---------------------------------------------
    // A glass cube focuses what it lets through, and it lands inside its own
    // shadow on the far side — brighter than the shadow, spread into a
    // spectrum, turning as the cube turns. It is the shaft's reason to exist.
    //
    // The fan lives inside the shaft and nowhere else — every term below ends
    // up multiplied by shaft, which is zero outside a small disc. Guarded so
    // the two transcendentals and the spectrum are not evaluated on the whole
    // screen only to be annihilated; the background is full-screen and drawn
    // twice a frame (the glass refracts it), so the saving counts double.
    if (shaft > 0.0) {
      float fanD = -sAlong / r;
      float ct = cos(uFanTurn);
      float st = sin(uFanTurn);
      vec2 fanAxis = vec2(uAcross.x * ct - uAcross.y * st, uAcross.x * st + uAcross.y * ct);
      float spread = dot(rel, fanAxis) / (r * max(0.1, uFanSpread));
      float fanBody = beam(fanD - 1.15, 0.7) * smoothstep(0.0, 0.5, fanD);
      float fanAmt = fanBody * exp(-spread * spread) * uFan * uSpectral * incident * shaft;
      // white at the heart, spectral only at the edges — the same lesson the
      // travelling sweep taught: a band coloured all the way through reads as a
      // green stain, not as light being split
      float fanFringe = smoothstep(0.15, 0.75, abs(spread));
      vec3 fanCol = mix(white, spectrum(clamp(spread * 0.5 + 0.5, 0.0, 1.0)), fanFringe);
      col = mix(col, fanCol, clamp(fanAmt * 0.55, 0.0, 1.0));
      // the city colour rides the fringe, at the discipline the floor pool uses
      col = mix(col, uCity, clamp(fanAmt, 0.0, 1.0) * uAccent * 0.06);
    }

    // faint city tint, top-left corner, never above 6%
    float corner = 1.0 - smoothstep(0.0, 1.05, length(p - vec2(-0.55 * uAspect, 0.5)));
    col = mix(col, uCity, corner * uCorner * uAccent);

    // a shadow reads cooler than the light it removes — but only where there
    // was light to remove: cooling the gaps between bands would turn the shaft
    // back into the smear the bands were meant to break up
    col *= mix(vec3(1.0), vec3(0.985, 0.992, 1.0), shaft * uBite * clamp(incident * 1.4, 0.0, 1.0));

    // soft vignette, barely there
    float vig = smoothstep(1.4, 0.35, length(p * vec2(0.8, 1.0)));
    col *= mix(1.0 - 0.035 * uVignette, 1.0, vig);

    col = mix(uCanvas, col, uReveal);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.rgb += dither(gl_FragCoord.xy, fract(t) * 37.0);
  }
`

export const CORE_VERT = /* glsl */ `
  varying vec3 vP;
  void main() {
    vP = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * The lit interior: a small volume ray-marched inside an inner box, so the
 * light fills the glass instead of sitting in it as a ball. Pink body, the
 * city colour gathering at the heart, a white-hot centre. Drawn with normal
 * blending so it still reads on a near-white ground.
 *
 * States reshape it without changing its nature: the diffuse body can move
 * (uBodyPos), a condensed kernel can appear and travel (uKernel*), and the
 * light can split into a spectrum (uDisperse along uDispDir: the three
 * channels sample the volume at small offsets, so where they disagree the
 * light shows its colours).
 *
 * It is drawn twice a frame. Into the glass's refraction buffer at uEcho
 * strength, where each face displaces its image sideways (a faint ghost pair
 * that makes the glass read as thick), and directly on the screen at full
 * strength with no depth test, so the light is always one body at its true
 * position. Without the direct pass the light doubled at most yaw angles.
 */
export const CORE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uAlpha;
  uniform float uAccent;
  uniform float uHalf;
  uniform vec3 uCamObj;
  uniform vec3 uPink;
  uniform vec3 uCity;
  uniform vec3 uBodyPos;
  uniform float uBodyHalf;
  uniform vec3 uKernelPos;
  uniform float uKernelHalf;
  uniform float uKernel;
  uniform float uDisperse;
  uniform vec3 uDispDir;
  uniform float uDispScale;
  uniform float uEcho;
  varying vec3 vP;
  ${NOISE}

  // rounded-cube isosurfaces: the glow remembers the box it lives in
  float shape(vec3 p, float h) {
    float r = length(p) / h;
    vec3 a = abs(p) / h;
    float cheb = max(a.x, max(a.y, a.z));
    float d = mix(r, cheb, 0.7);
    float k = 1.0 - smoothstep(0.15, 1.0, d);
    return k * k;
  }
  float density(vec3 p) {
    float body = shape(p - uBodyPos, uBodyHalf) * (1.0 - 0.55 * uKernel);
    float kern = shape(p - uKernelPos, uKernelHalf) * uKernel * 3.0;
    return body + kern;
  }

  void main() {
    vec3 ro = uCamObj;
    vec3 rd = normalize(vP - ro);
    // slab test against the inner box
    vec3 inv = 1.0 / rd;
    vec3 t0 = (-uHalf - ro) * inv;
    vec3 t1 = ( uHalf - ro) * inv;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);
    float tn = max(max(tmin.x, tmin.y), max(tmin.z, 0.0));
    float tf = min(tmax.x, min(tmax.y, tmax.z));
    if (tf <= tn) discard;

    vec3 off = uDispDir * (uDispScale * uDisperse);
    vec3 heartPos = mix(uBodyPos, uKernelPos, uKernel);
    float heartHalf = mix(uBodyHalf, uKernelHalf * 1.35, uKernel);

    const int N = CORE_STEPS;
    float dt = (tf - tn) / float(N);
    float jitter = hash21(gl_FragCoord.xy) * dt;
    vec3 acc = vec3(0.0);
    float heart = 0.0;
    for (int i = 0; i < N; i++) {
      vec3 p = ro + rd * (tn + jitter + dt * (float(i) + 0.5));
      // slow internal structure: the swirl thins and thickens the volume in 3D
      float sw = vnoise(p.xy * 1.6 / uHalf + vec2(uTime * 0.05, -uTime * 0.04)) * 0.5 +
                 vnoise(p.zy * 1.4 / uHalf - vec2(uTime * 0.04, uTime * 0.03)) * 0.5;
      float m = (0.7 + 0.6 * sw) * dt;
      acc += vec3(density(p + off), density(p), density(p - off)) * m;
      vec3 hp = (p - heartPos) / heartHalf;
      heart += exp(-dot(hp, hp) * 6.0) * dt;
    }
    vec3 body3 = 1.0 - exp(-acc * 1.3 * uIntensity);
    float body = (body3.r + body3.g + body3.b) / 3.0;
    float hot = clamp(heart * 1.1 * uIntensity * (uHalf / heartHalf) * (1.0 + 0.5 * uKernel), 0.0, 1.0);

    vec3 deep = mix(uPink, uPink * vec3(0.98, 0.72, 0.8), 0.5);
    vec3 col = mix(deep, uCity, clamp(uAccent * (hot * 1.4 + 0.15), 0.0, 1.0));
    // the kernel is white-hot at its heart with a city-tinted halo, so a red city never reads as a warning light
    col = mix(col, vec3(1.0), hot * hot * (0.45 + 0.3 * uKernel));
    col *= 1.0 + 0.35 * (uIntensity - 1.0);
    // the spectrum: where the channels disagree, the light shows its colours
    vec3 ratio = body3 / max(body, 1e-4);
    col *= mix(vec3(1.0), ratio, 0.95);
    float a = clamp(body * 0.62 + hot * 0.45, 0.0, 1.0) * uAlpha * uEcho;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
    gl_FragColor.rgb += dither(gl_FragCoord.xy, 3.0);
  }
`

/**
 * Ground caustics: warped sine fields with r/g/b sampled at radial offsets so
 * every filament carries a rainbow fringe, pink light with a city-coloured
 * fringe, pooled in a soft ellipse under the cube, over a contact shadow.
 * The plane is tipped toward the camera; uv.y = 1 is the far (under-cube) edge.
 */
export const CAUSTIC_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  uniform float uFlash;
  uniform float uAccent;
  uniform vec3 uPink;
  uniform vec3 uCity;
  uniform vec3 uShadow;
  uniform vec2 uCenter;
  uniform vec2 uShadowOff;
  uniform float uShift;
  uniform float uSharp;
  uniform float uShadowSoft;
  varying vec2 vUv;
  ${NOISE}

  float field(vec2 p, float t) {
    vec2 q = p;
    float v = 0.0;
    float amp = 0.55;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      q += 0.34 * vec2(sin(q.y * 1.9 + t * 0.5 + fi * 1.9), cos(q.x * 1.7 - t * 0.43 + fi * 1.3));
      float s = sin(q.x * 2.6 + t * 0.33 + fi) * cos(q.y * 2.2 - t * 0.27 - fi * 0.7);
      float k = 1.0 - abs(s);
      float k2 = k * k;
      v += amp * k2 * k2 * k;
      amp *= 0.7;
    }
    return v;
  }

  void main() {
    // plane-space coordinates in world units. uCenter carries the pool away
    // from directly beneath: the light arrives at an angle, so what the glass
    // throws lands to one side, and the body's shadow falls the same way.
    vec2 c0 = (vUv - vec2(0.5, 0.56)) * 2.8;
    vec2 c = c0 - uCenter;
    vec2 dir = normalize(c + vec2(1e-4, 1e-4));
    float t = uTime * (1.0 + uFlash * 1.5);
    vec2 p = c * 2.4;
    float shift = uShift + uFlash * 0.06;
    float cr = field(p + dir * shift, t);
    float cg = field(p, t);
    float cb = field(p - dir * shift, t);
    vec3 light = vec3(cr, cg, cb);
    float avg = (cr + cg + cb) / 3.0;
    light = mix(vec3(avg), light, 0.5);
    light = smoothstep(0.35 + 0.12 * uSharp, 0.9 - 0.12 * uSharp, light);

    // the envelope stays under the cube — only the filaments and the hot core
    // travel with the light, so the pool leans without sliding out from under it
    float rad = length(c0 * vec2(1.0, 1.25));
    float mask = 1.0 - smoothstep(0.3, 1.0, rad);
    float inner = 1.0 - smoothstep(0.0, 0.7, rad);

    vec3 base = uPink * vec3(1.0, 0.9, 0.93);
    vec3 cc = base * (0.55 + 0.5 * light);
    // rainbow fringe where the channels disagree: the channel that wins tints the filament
    float disagree = max(max(abs(cr - cg), abs(cg - cb)), abs(cr - cb));
    vec3 tint = normalize(light + 0.05) * 1.1;
    cc = mix(cc, cc * tint, clamp(disagree * 2.2, 0.0, 1.0) * 0.8);
    cc = mix(cc, uCity, clamp(disagree * 1.6, 0.0, 1.0) * uAccent * 0.55);
    float ca = max(max(light.r, light.g), light.b) * mask * (0.55 + 0.45 * inner) * uIntensity * (1.0 + uFlash * 1.1);
    // where the beam actually exits the glass: a hot core inside the pool
    ca += exp(-dot(c, c) * 6.0) * uIntensity * 0.09 * mask;
    ca = clamp(ca * 1.3, 0.0, 0.95);

    // contact shadow: tight, thrown away from the light, lighter than the light
    vec2 sc = (vUv - vec2(0.5, 0.5)) * 2.8 - uShadowOff;
    float sa = (1.0 - smoothstep(0.0, 0.55 + 0.4 * uShadowSoft, length(sc))) * 0.28 * (1.0 - 0.45 * uShadowSoft);
    sa *= 1.0 - 0.3 * inner * ca;

    float A = ca + sa * (1.0 - ca);
    vec3 C = (cc * ca + uShadow * sa * (1.0 - ca)) / max(A, 1e-4);
    gl_FragColor = vec4(C, A * uOpacity);
    #include <colorspace_fragment>
    gl_FragColor.rgb += dither(gl_FragCoord.xy, fract(t) * 11.0);
  }
`

export const DOME_VERT = /* glsl */ `
  varying vec3 vW;
  void main() {
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Studio dome for the procedural environment: bright warm white above, a
 * pinked horizon, a deeper warm floor, and a thin darker band right at the
 * horizon. The vertical bevels reflect that band, which is what draws the
 * crisp edge lines a glass cube needs on a white ground.
 */
export const DOME_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uFloor;
  uniform vec3 uBand;
  varying vec3 vW;
  void main() {
    float y = normalize(vW).y;
    vec3 c = y > 0.0
      ? mix(uHorizon, uTop, smoothstep(0.0, 0.7, y))
      : mix(uHorizon, uFloor, smoothstep(0.0, 0.5, -y));
    float band = 1.0 - smoothstep(0.0, 0.09, abs(y + 0.03));
    c = mix(c, uBand, band * 0.85);
    gl_FragColor = vec4(c, 1.0);
  }
`

/**
 * Injected before <opaque_fragment> in MeshTransmissionMaterial: a thin
 * vertical strip light evaluated analytically on the reflection vector, so the
 * specular sweep costs no environment re-render. The strip is prismatic
 * (r → g → b across its width) so it reads on a white cube on a white ground.
 */
export const STREAK_INJECT = /* glsl */ `
  {
    vec3 rW = inverseTransformDirection(reflect(-geometryViewDir, geometryNormal), viewMatrix);
    float across = dot(rW, uStreakN) / uStreakWidth;
    float band = exp(-across * across * 0.6);
    float facing = smoothstep(0.0, 0.25, dot(rW, uStreakD));
    float vert = 1.0 - smoothstep(0.55, 0.85, abs(rW.y - uStreakD.y));
    float dNV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
    float f1 = 1.0 - dNV;
    float f2 = f1 * f1;
    float Fs = 0.06 + 0.94 * f2 * f2 * f1;
    // the band travels in WORLD space, along an axis perpendicular to the light,
    // so it reads as a light passing the cube rather than a mark painted on it
    // (it used to slide along an object-space axis, which turned with the cube)
    vec3 nW = inverseTransformDirection(geometryNormal, viewMatrix);
    vec3 objN = normalize(mat3(uInvModel) * nW);
    float slide = dot(vWorldPosition - uCubeCenter, uSweepAxis) - uSweepPhase;
    float travel = exp(-slide * slide / uSweepWidth);
    // the travelling band is white at its core and spectral at its edges (red leads, blue
    // trails), so a flat face never fills with one colour
    float hs = clamp(slide / (2.6 * sqrt(uSweepWidth)) + 0.5, 0.0, 1.0);
    vec3 prism = vec3(1.0 - smoothstep(0.1, 0.55, hs), 1.0 - abs(hs - 0.5) * 2.0, smoothstep(0.45, 0.9, hs));
    float fringe = smoothstep(0.1, 0.5, abs(hs - 0.5) * 2.0);
    vec3 bandColor = mix(vec3(1.0), clamp(prism, 0.0, 1.0), uPrism * fringe) * uStreakColor;
    vec3 restColor = vec3(1.0, 0.985, 0.99) * uStreakColor;
    vec3 add = (restColor * 0.35 + bandColor * 1.0 * travel) * band * facing * vert * (0.25 + 0.75 * Fs);
    // the bright bevel is whichever one faces the light, city tinted, drawn here so
    // it is never refracted twice. Bevel normals sit off the object axes; a flat
    // face's normal sits on one, which is how the glow stays on the edges.
    float axis = max(abs(objN.x), max(abs(objN.y), abs(objN.z)));
    float bevel = 1.0 - smoothstep(0.80, 0.995, axis);
    float edge = bevel * smoothstep(0.25, 0.88, dot(nW, uLightDir));
    add += uEdgeColor * edge * uEdgeGain;

    // The glass is toneMapped: false, so a plain += clips hard and the sweep was
    // flattening whole faces to paper white — the material disappears and it reads
    // as a flash. Add into the remaining headroom instead: small highlights land in
    // full, large ones asymptote just under white, and where nothing is added the
    // colour is untouched (compressing outgoingLight itself turned the glass grey).
    vec3 room = max(vec3(0.0), vec3(1.02) - outgoingLight);
    outgoingLight += room * (1.0 - exp(-add / max(room, vec3(0.02))));
  }
`
