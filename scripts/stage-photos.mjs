#!/usr/bin/env node
// Turn the All-Hands stage photographs into stage-ready assets.
//
//   node scripts/stage-photos.mjs ["~/Downloads/Proto BG Photos"]   (npm run stage:photos)
//
// The sources are 2880×2048 JPEGs of 3–4 MB each — fine to look at, wrong to
// put on a stage. This writes AVIF at the two widths a presentation screen
// actually needs (plus a WebP fallback), and a generated manifest
// (lib/demo/stagePhotos.ts) carrying everything the stage needs to know about
// each photo *without* measuring it at runtime:
//
//  · a blurred placeholder, so a photo can never pop in while it decodes;
//  · its mean luminance, and the scrim alpha solved from it — the photos span
//    a 4× range of brightness, so one fixed scrim would leave the phone on a
//    different darkness in every room;
//  · its shadow colour, which tints that scrim so the phone darkens into the
//    room's own colour rather than neutral black, and the same hue lifted to a
//    mid-tone for the phone's rim light;
//  · measured anchors — the thermostat, the curtain seam, the lamps — so the
//    micro-interactions land on the pixels they are about.
//
// Files are matched by their numeric prefix, so the photos can be renamed
// freely as long as the number stays. `1b-` is optional: a lights-off render
// of the Friday room. When it exists, the lights switch crossfades between two
// real photographs instead of faking the dark with an overlay.
//
// Uses the `sharp` that ships with Next — no new dependency.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(ROOT, "public/allhands/stage");
const MANIFEST = path.join(ROOT, "lib/demo/stagePhotos.ts");

const arg = process.argv[2];
const SRC = arg
  ? path.resolve(arg.replace(/^~/, os.homedir()))
  : path.join(os.homedir(), "Downloads/Proto BG Photos");

/** Prefix → stable id. The id is what beats refer to; never the filename. */
const PREFIXES = [
  ["1b-", "ac-dark"],
  ["1-", "ac"],
  ["2-", "blinds-closed"],
  ["3-", "blinds-open"],
  ["4-", "sunday"],
  ["5-", "train"],
];
const REQUIRED = ["ac", "blinds-closed", "blinds-open", "sunday", "train"];

/** A projector is 1920 wide; a laptop driving it at 2x wants more. 2880 would
 *  cost ~120 MB of decoded memory for five photos. */
const WIDTHS = [1920, 2560];

/** The luminance (0–255) every photo lands on behind the phone. Low enough
 *  that the phone is unambiguously the subject, high enough that the room is
 *  still recognisably there — a dark, translucent backdrop rather than a black
 *  one. The single dial for how much room shows behind the phone. */
const TARGET_LUMA = 22;
/** The scrim keeps each photo's shadow hue but at this fixed darkness, so a
 *  bright photo's shadow colour can still pull it all the way down. */
const SCRIM_LUMA = 6;
/** The rim light: the same hue, lifted to where it reads as light. */
const GLOW_LUMA = 96;

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const pct = (v) => Math.round(v * 1000) / 10;

async function raw(file, width) {
  const { data, info } = await sharp(file).rotate().resize(width).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}

/**
 * Where the photo is actually *seen* behind the phone: two bands either side
 * of it, mid-height, on a 16:9 screen. The phone covers the centre and the
 * cover crop takes ~10 % off the top and bottom, so a whole-photo mean is the
 * wrong thing to solve against — the train's bright sky, cropped off-screen,
 * pulled its whole mean up and its scrim came out a stop too dark. These are
 * the same bands scripts/shoot-story.mjs measures.
 */
const SEEN = { bands: [[0.19, 0.367], [0.633, 0.81]], y: [0.262, 0.738] };

/** Whole-photo mean, mean where it's seen, and the darkest 5–15 % colour. */
async function tone(file) {
  const { data, w, h, c } = await raw(file, 192);
  const px = [];
  let sum = 0, seenSum = 0, seenN = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const r = data[i * c], g = data[i * c + 1], b = data[i * c + 2];
      const l = luma(r, g, b);
      sum += l;
      px.push([l, r, g, b]);
      const fx = x / w, fy = y / h;
      if (fy >= SEEN.y[0] && fy <= SEEN.y[1] && SEEN.bands.some(([a, z]) => fx >= a && fx <= z)) { seenSum += l; seenN++; }
    }
  }
  px.sort((a, b) => a[0] - b[0]);
  const band = px.slice(Math.floor(px.length * 0.05), Math.floor(px.length * 0.15));
  const avg = [1, 2, 3].map((k) => band.reduce((s, p) => s + p[k], 0) / band.length);
  return { mean: sum / (w * h), seen: seenSum / seenN, shadow: avg };
}

/** A hue rescaled to a given luminance, without letting any channel clip. */
function atLuma([r, g, b], target) {
  const k = target / Math.max(luma(r, g, b), 1);
  const m = Math.max(r * k, g * k, b * k);
  const f = m > 255 ? 255 / m : 1;
  return hex(r * k * f, g * k * f, b * k * f);
}

/** Solve alpha so photo·(1-a) + scrim·a has mean luminance TARGET_LUMA. */
function scrimAlpha(mean) {
  if (mean <= TARGET_LUMA) return 0.25; // already darker than the target: just settle it
  return Math.min(0.94, Math.max(0.25, (mean - TARGET_LUMA) / (mean - SCRIM_LUMA)));
}

/** Centroid of the pixels matching `test`, within a region, as percentages. */
async function centroid(file, test, { x0 = 0, x1 = 1, y0 = 0, y1 = 1 } = {}) {
  const { data, w, h, c } = await raw(file, 480);
  let sx = 0, sy = 0, n = 0;
  for (let y = Math.floor(y0 * h); y < y1 * h; y++) {
    for (let x = Math.floor(x0 * w); x < x1 * w; x++) {
      const o = (y * w + x) * c;
      if (test(data[o], data[o + 1], data[o + 2])) { sx += x; sy += y; n++; }
    }
  }
  if (!n) return null;
  return { x: pct(sx / n / w), y: pct(sy / n / h), n };
}

/** The brightest narrow vertical column in a band — the curtain seam. */
async function seam(file) {
  const { data, w, h, c } = await raw(file, 480);
  const y0 = Math.floor(h * 0.15), y1 = Math.floor(h * 0.4);
  let best = [0, -1];
  for (let x = Math.floor(w * 0.3); x < w * 0.7; x++) {
    let s = 0;
    for (let y = y0; y < y1; y++) { const o = (y * w + x) * c; s += data[o] + data[o + 1] + data[o + 2]; }
    if (s > best[1]) best = [x, s];
  }
  return { x: pct(best[0] / w) };
}

// Warm, bright, and not the pale bedding: a lamp or its pool.
const isLampGlow = (r, g, b) => r > 215 && r - b > 70 && g > 120;
// The thermostat's display is the only saturated blue on the room's walls
// (the windows are blue too, so it is searched for right of them).
const isThermostat = (r, g, b) => b > 140 && b - r > 70 && b - g > 30;

async function anchorsFor(id, file) {
  if (id === "ac" || id === "ac-dark") {
    return {
      thermostat: await centroid(file, isThermostat, { x0: 0.7 }),
      pendant: await centroid(file, isLampGlow, { x0: 0.3, x1: 0.53, y0: 0.15, y1: 0.5 }),
      desk: await centroid(file, isLampGlow, { x0: 0.53, x1: 0.72, y0: 0.4, y1: 0.75 }),
    };
  }
  if (id === "blinds-closed") return { seam: await seam(file) };
  return {};
}

async function main() {
  if (!fs.existsSync(SRC)) throw new Error(`No photo folder at ${SRC}`);
  const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
  const found = new Map();
  for (const f of files) {
    const hit = PREFIXES.find(([p]) => f.toLowerCase().startsWith(p));
    if (hit && !found.has(hit[1])) found.set(hit[1], path.join(SRC, f));
  }
  // A photo without a number prefix is invisible to the stage — say so, rather
  // than let a newly dropped-in file be silently skipped. (Files starting with
  // "_" are deliberately parked and stay quiet.)
  const ignored = files.filter((f) => !f.startsWith("_") && !PREFIXES.some(([p]) => f.toLowerCase().startsWith(p)));
  for (const f of ignored) console.warn(`⚠️  ignored: ${f} — no number prefix (e.g. rename to 3-${f})`);

  const missing = REQUIRED.filter((id) => !found.has(id));
  if (missing.length) throw new Error(`Missing photos for: ${missing.join(", ")} (in ${SRC})`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = [];

  for (const [id, file] of found) {
    const t0 = Date.now();
    const meta = await sharp(file).metadata();
    for (const w of WIDTHS) {
      const base = sharp(file).rotate().resize({ width: w, withoutEnlargement: true });
      await base.clone().avif({ quality: 56, effort: 4 }).toFile(path.join(OUT_DIR, `${id}-${w}.avif`));
    }
    // WebP only as the <img src> fallback, at stage width.
    await sharp(file).rotate().resize({ width: WIDTHS[0] }).webp({ quality: 80 }).toFile(path.join(OUT_DIR, `${id}-${WIDTHS[0]}.webp`));
    const placeholder = await sharp(file).rotate().resize(32).blur(1.2).webp({ quality: 50 }).toBuffer();
    const { mean, seen, shadow } = await tone(file);
    const anchors = await anchorsFor(id, file);

    const entry = {
      id,
      width: meta.width,
      height: meta.height,
      avif: WIDTHS.map((w) => `/allhands/stage/${id}-${w}.avif ${w}w`).join(", "),
      fallback: `/allhands/stage/${id}-${WIDTHS[0]}.webp`,
      placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
      luma: Math.round(mean),
      seenLuma: Math.round(seen),
      scrim: { color: atLuma(shadow, SCRIM_LUMA), alpha: Math.round(scrimAlpha(seen) * 100) / 100 },
      glow: atLuma(shadow, GLOW_LUMA),
      anchors,
    };
    entries.push(entry);
    const kb = WIDTHS.map((w) => Math.round(fs.statSync(path.join(OUT_DIR, `${id}-${w}.avif`)).size / 1024));
    console.log(
      `${id.padEnd(14)} luma ${String(entry.luma).padStart(3)}  seen ${String(entry.seenLuma).padStart(3)}  scrim ${entry.scrim.color} @ ${entry.scrim.alpha}  glow ${entry.glow}` +
        `  avif ${kb.join("/")} KB  ${Date.now() - t0}ms` +
        (Object.keys(anchors).length ? `\n${" ".repeat(16)}anchors ${JSON.stringify(anchors)}` : ""),
    );
  }

  const body = entries
    .map((e) => `  ${JSON.stringify(e.id)}: ${JSON.stringify(e, null, 2).replace(/\n/g, "\n  ")},`)
    .join("\n");

  fs.writeFileSync(
    MANIFEST,
    `// ⚠️  GENERATED by scripts/stage-photos.mjs — do not edit by hand.
// Re-run \`npm run stage:photos\` after changing the photographs.
import type { StagePhotoId } from "./types";

/** A point on a photo, as percentages of its width and height. */
export interface StageAnchor { x: number; y?: number; n?: number }

export interface StagePhoto {
  id: StagePhotoId | "ac-dark";
  width: number;
  height: number;
  /** AVIF srcset, and a WebP src for anything without AVIF. */
  avif: string;
  fallback: string;
  /** A tiny blurred image that paints instantly while the real one decodes. */
  placeholder: string;
  /** Mean luminance, 0–255 — of the whole photo, and of the bands actually
   *  seen either side of the phone (what the scrim is solved against). */
  luma: number;
  seenLuma: number;
  /** Phone-focus scrim: the photo's shadow hue at a fixed darkness, and the
   *  alpha that lands this photo on the shared target luminance. */
  scrim: { color: string; alpha: number };
  /** The shadow hue lifted to a visible mid-tone — the phone's rim light. */
  glow: string;
  anchors: Record<string, StageAnchor | null>;
}

export const STAGE_PHOTOS: Record<StagePhotoId, StagePhoto> & { "ac-dark"?: StagePhoto } = {
${body}
};
`,
  );
  console.log(`\nWrote ${entries.length} photos → public/allhands/stage/, manifest → lib/demo/stagePhotos.ts`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
