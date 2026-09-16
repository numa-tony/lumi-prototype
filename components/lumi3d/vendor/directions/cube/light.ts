// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/directions/cube/light.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// The Cube's one light.
//
// Everything in the frame that reads as illumination is derived from this
// single direction: the beams in the background, the studio's key strip, the
// highlight that travels the faces, the bright bevel, the shadow the cube
// bites out of the beam, and where the light lands on the floor. Before this
// the background lit from the top right while the studio's key sat upper
// left, the travelling highlight orbited on its own timer, and the caustics
// pooled straight down as if lit from overhead — three light sources
// disagreeing in one picture.
import * as THREE from 'three'

/**
 * Where the one light is, tuned on the deployed site.
 *
 * degrees around Y, from +Z (toward the camera) turning toward +X (screen
 * right). At 9 the light is almost straight in front of the cube rather than
 * off to one side, which is what stands the beams up: projected to the screen
 * the light's direction is close to vertical, so the curtain's bands fall down
 * the frame the way light through a window does, instead of running across it
 * on a diagonal.
 */
export const LIGHT_AZIMUTH = 9
/** degrees above the horizon: high, a summer morning rather than a low sun */
export const LIGHT_ELEVATION = 41

/** the caustic plane's drop below the cube's centre (SIZE / 2 + 0.1) */
const FLOOR_DROP = 0.775
/**
 * Glass bends a ray hard back toward the vertical, so the pool lands well short
 * of the geometric throw. Kept small on purpose: the offset should say which way
 * the light is coming from, not detach the pool from the object making it.
 */
const REFRACT_PULL = 0.22
/** the contact shadow is cast by the body, not the refracted beam, so it moves less */
const SHADOW_PULL = 0.14

/** world-space unit vector pointing from the cube toward the light */
export function setLightDir(out: THREE.Vector3, azimuthDeg: number, elevationDeg: number) {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  const c = Math.cos(el)
  return out.set(Math.sin(az) * c, Math.sin(el), Math.cos(az) * c).normalize()
}

/**
 * The light's direction on screen, in the background shader's p-space. That
 * space is isotropic with world units (both are the frustum's half-height over
 * 0.4), so projecting onto the camera's right and up axes is exact rather than
 * an approximation. `along` points toward the light; `across` is signed to
 * match the beam offsets the background was tuned with.
 */
export function setScreenAxes(camera: THREE.Camera, L: THREE.Vector3, along: THREE.Vector2, across: THREE.Vector2) {
  const e = camera.matrixWorld.elements
  along.set(L.x * e[0] + L.y * e[1] + L.z * e[2], L.x * e[4] + L.y * e[5] + L.z * e[6])
  if (along.lengthSq() < 1e-8) along.set(0.7071, 0.7071)
  along.normalize()
  across.set(along.y, -along.x)
}

/**
 * Where the light lands on the floor, as an offset from directly beneath the
 * cube, already in the caustic plane's own coordinates (world x, world -z).
 * The pool is the refracted beam; the shadow is cast by the body and moves less.
 */
export function setFloorThrow(out: THREE.Vector2, L: THREE.Vector3, kind: 'pool' | 'shadow') {
  const down = Math.max(0.25, L.y)
  const t = (FLOOR_DROP / down) * (kind === 'pool' ? REFRACT_PULL : SHADOW_PULL)
  return out.set(-L.x * t, L.z * t)
}

/**
 * Studio placements derived from the light: the thin key strip sits on it, a
 * warm panel flanks it on the light side, a cool panel fills from the opposite
 * side, and the softbox leans toward it.
 */
export function studioRig(L: THREE.Vector3) {
  return {
    key: L.clone().multiplyScalar(4.4),
    warm: new THREE.Vector3(L.x, 0.28, L.z).normalize().multiplyScalar(6.6),
    cool: new THREE.Vector3(-L.x, 0.14, -L.z).normalize().multiplyScalar(6.6),
    top: new THREE.Vector3(L.x * 0.3, 1, L.z * 0.22).normalize().multiplyScalar(7),
  }
}

/**
 * The one light, aimed. The pointer (or a phone's tilt) nudges it a few
 * degrees: because everything derives from this direction, that one number
 * moves the beams, the bevel, the sweep, the shadow and the floor pool
 * together, which is what makes the hand feel like it is moving a light
 * rather than sliding a picture. Kept small — a large aim reads as a toy.
 *
 * The studio's cubemap is baked and does not follow; at these angles the
 * difference in the environment is below the noise floor of a pastel dome.
 */
export function aimedLight(
  out: THREE.Vector3,
  azimuthDeg: number,
  elevationDeg: number,
  aimDeg: number,
  px: number,
  py: number,
) {
  return setLightDir(out, azimuthDeg + px * aimDeg, elevationDeg + py * aimDeg * 0.5)
}
