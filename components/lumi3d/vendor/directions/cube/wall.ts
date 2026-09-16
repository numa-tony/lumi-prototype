// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/cube/wall.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// The surface the light lands on.
//
// A flat colour gives light nothing to be light *on*: rays float in front of
// the canvas instead of falling across it. This bakes a plaster micro-relief
// once at mount — the same trick a lit wall does in a photograph — and the
// background shades it with the one light, only where a ray reaches. At the
// amplitudes the dials default to it is a few least-significant bits of
// shading, invisible on its own and the reason the rays read as real.
//
// Baked rather than evaluated per pixel because a normal needs three noise
// samples and the background is drawn twice a frame (the glass refracts it).
// The lattice wraps, so the texture tiles without a seam.
import * as THREE from 'three'

/**
 * The lattice wraps at `period`, which is what makes the texture tile — and it
 * has to be the period of *this* octave, not one shared number. Wrapping every
 * octave at a single 32 tiled only the octave whose frequency happened to be
 * 32; the rest ran straight off the end, leaving a seam where the field
 * restarted. Measured, that seam was a step of 0.223 in height against a
 * typical neighbour step of 0.0013, which lands in the baked normal map as an
 * aligned line repeated across the frame — exactly the artefact the eye finds
 * first on a near-flat wall.
 *
 * Math.imul throughout: the plain multiplies overflowed both int32 and the
 * exactly-representable integers, so the mixing was weaker than it reads.
 */
function hash2(xi: number, yi: number, period: number): number {
  const x = ((xi % period) + period) % period
  const y = ((yi % period) + period) % period
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function vnoise(x: number, y: number, period: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash2(xi, yi, period)
  const b = hash2(xi + 1, yi, period)
  const c = hash2(xi, yi + 1, period)
  const d = hash2(xi + 1, yi + 1, period)
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy
}

/**
 * Plaster: a coarse trowelled undulation with a fine tooth over it. Each octave
 * wraps at its own frequency, so every one of them — and therefore the sum —
 * is periodic over the unit square and the texture tiles.
 */
function height(u: number, v: number): number {
  let h = 0
  let amp = 0.5
  let f = 4
  for (let i = 0; i < 4; i++) {
    h += amp * vnoise(u * f, v * f, f)
    f *= 2
    amp *= 0.5
  }
  return h * 0.72 + vnoise(u * 24, v * 24, 24) * 0.28
}

/**
 * A tiling normal map of the wall. Red and green carry the normal's x and y
 * (0.5 is flat); the background dots them against the light's screen
 * direction, so nothing here needs a z.
 *
 * `size` must be a power of two: the shared height grid below relies on
 * `x / size` being exact so a neighbour's sample is the same number the
 * per-texel difference would have asked for.
 */
export function bakeWall(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4)
  // The central differences a texel wants are its neighbours' heights, and
  // every neighbour is some other texel's own sample: with size a power of two
  // `x / size ± 1 / size` is exactly `(x ± 1) / size`, so one height grid
  // serves all four taps. Sampling per texel instead cost four heights each —
  // twenty noise lookups a pixel, five million hashes at 256, all of it
  // synchronous inside the mount. The one-texel border is computed rather than
  // copied from the far edge; now that every octave wraps the two are the same
  // number, and computing it keeps the grid independent of that. Float64 and
  // not Float32: `height` computes at double precision, and narrowing the grid
  // on the way in moves a few texels a level.
  const stride = size + 2
  const h = new Float64Array(stride * stride)
  for (let y = -1; y <= size; y++) {
    for (let x = -1; x <= size; x++) {
      h[(y + 1) * stride + (x + 1)] = height(x / size, y / size)
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = (y + 1) * stride + (x + 1)
      // central differences on the wrapped field: the slope is the normal
      const nx = h[c - 1] - h[c + 1]
      const ny = h[c - stride] - h[c + stride]
      const i = (y * size + x) * 4
      data[i] = Math.round(THREE.MathUtils.clamp(nx * 6 + 0.5, 0, 1) * 255)
      data[i + 1] = Math.round(THREE.MathUtils.clamp(ny * 6 + 0.5, 0, 1) * 255)
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}
