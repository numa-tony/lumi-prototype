#!/usr/bin/env node
// Pull the Lumi knot — Lumi's holographic torus-knot presence — out of
// numa-lumi-branding and into this repo.
//
// numa-lumi-branding is the upstream and the only place the knot's *look* is
// decided (v5–v9 there). This repo decides where it sits in the chat sheet and
// when it thinks — nothing more. Same split as scripts/sync-lumi3d.mjs:
//
//   • vendor/ is written from upstream and is NEVER hand-edited. Change the
//     knot upstream and re-run this.
//   • codemods below are the mechanical fixes a React host needs that a static
//     page doesn't. Each must match exactly once, so an upstream rename is a
//     loud failure rather than a silently un-patched file. The big one is
//     teardown: upstream's createKnot() runs its frame loop forever, which is
//     fine for a page that owns one knot for life, and leaks a WebGL context
//     every time a chat sheet mounts it here. If upstream grows its own
//     dispose(), delete codemods 2–4.
//   • UPSTREAM.json records the commit we copied from, so "which knot is in
//     the demo?" always has an answer.
//
// Usage:
//   node scripts/sync-lumi-knot.mjs [path-to-numa-lumi-branding]   (default: ../numa-lumi-branding)
//   node scripts/sync-lumi-knot.mjs --check                        (fail if vendor/ drifted)

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEST = path.join(ROOT, "components/lumi-knot/vendor");

const args = process.argv.slice(2);
const check = args.includes("--check");
const upstreamArg = args.find((a) => !a.startsWith("--"));
const UPSTREAM = path.resolve(ROOT, upstreamArg ?? "../numa-lumi-branding");

/** Modules copied from the upstream repo root. */
const FILES = ["lumi-knot.js", "lumi-knot-states.js", "lumi-knot-morph.js"];

/** Binary assets, upstream path → path in this repo. Copied byte for byte. */
const ASSETS = [["assets/matcap-holo.png", "public/lumi-knot/matcap-holo.png"]];

/**
 * [file, description, find, replace]. `find` is a literal string and must
 * occur exactly once in the file.
 */
const CODEMODS = [
  [
    "lumi-knot.js",
    "matcap served from /public — upstream loads it relative to the page",
    `new THREE.TextureLoader().load("./assets/matcap-holo.png")`,
    `new THREE.TextureLoader().load("/lumi-knot/matcap-holo.png")`,
  ],
  [
    "lumi-knot.js",
    "frame loop holds its rAF id and stops once disposed",
    `  function frame() {\n`,
    `  let __rafId = 0;\n  let __disposed = false;\n  function frame() {\n    if (__disposed) return;\n`,
  ],
  [
    "lumi-knot.js",
    "frame loop reschedules through the held id",
    `    requestAnimationFrame(frame);\n  }\n  requestAnimationFrame(frame);\n`,
    `    if (!__disposed) __rafId = requestAnimationFrame(frame);\n  }\n  __rafId = requestAnimationFrame(frame);\n`,
  ],
  [
    "lumi-knot.js",
    "dispose(): stop the loop and release every GPU resource createKnot made",
    `  return {\n    setState,\n`,
    `  return {
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
`,
  ],
];

const BANNER = (rel, sha, mods) =>
  `// ⚠️  VENDORED — DO NOT EDIT.\n` +
  `// Copied from numa-lumi-branding/${rel} @ ${sha.slice(0, 12)}\n` +
  `// by scripts/sync-lumi-knot.mjs. Change it upstream and re-run the script.\n` +
  (mods.length ? `// Codemods applied:\n${mods.map((d) => `//   · ${d}\n`).join("")}` : "");

function occurrences(text, find) {
  return text.split(find).length - 1;
}

function gitInfo() {
  let sha = "unknown";
  let dirty = false;
  try {
    sha = execFileSync("git", ["-C", UPSTREAM, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    dirty =
      execFileSync(
        "git",
        ["-C", UPSTREAM, "status", "--porcelain", "--", ...FILES, ...ASSETS.map(([from]) => from)],
        { encoding: "utf8" },
      ).trim().length > 0;
  } catch {
    /* upstream may not be a git repo; the SHA is a nicety, not a requirement */
  }
  return { sha, dirty };
}

function build() {
  if (!fs.existsSync(path.join(UPSTREAM, "lumi-knot.js"))) {
    throw new Error(
      `No numa-lumi-branding at ${UPSTREAM}.\n` +
        `Pass its path: node scripts/sync-lumi-knot.mjs ../numa-lumi-branding`,
    );
  }
  const { sha, dirty } = gitInfo();

  /** @type {Map<string, string>} vendor-relative path → text */
  const out = new Map();
  for (const rel of FILES) {
    let text = fs.readFileSync(path.join(UPSTREAM, rel), "utf8");
    const applied = [];
    for (const [file, desc, find, replace] of CODEMODS) {
      if (file !== rel) continue;
      const n = occurrences(text, find);
      if (n !== 1) {
        throw new Error(
          `Codemod matched ${n}× (expected exactly 1) in ${rel} — upstream probably changed:\n  ${desc}`,
        );
      }
      text = text.replace(find, () => replace);
      applied.push(desc);
    }
    out.set(rel, BANNER(rel, sha, applied) + "\n" + text);
  }

  /** @type {Map<string, Buffer>} repo-relative path → bytes */
  const assets = new Map();
  for (const [from, to] of ASSETS) {
    const src = path.join(UPSTREAM, from);
    if (!fs.existsSync(src)) throw new Error(`Upstream asset missing: ${from}`);
    assets.set(to, fs.readFileSync(src));
  }

  const hash = (data) => createHash("sha256").update(data).digest("hex").slice(0, 16);
  const manifest = {
    upstream: path.relative(ROOT, UPSTREAM),
    commit: sha,
    dirty,
    syncedAt: new Date().toISOString(),
    files: Object.fromEntries([...out].map(([rel, text]) => [rel, hash(text)])),
    assets: Object.fromEntries([...assets].map(([rel, buf]) => [rel, hash(buf)])),
  };
  return { out, assets, manifest, sha, dirty };
}

const { out, assets, manifest, sha, dirty } = build();

if (check) {
  const drifted = [
    ...[...out]
      .filter(([rel, text]) => {
        const p = path.join(DEST, rel);
        return !fs.existsSync(p) || fs.readFileSync(p, "utf8") !== text;
      })
      .map(([rel]) => `components/lumi-knot/vendor/${rel}`),
    ...[...assets]
      .filter(([rel, buf]) => {
        const p = path.join(ROOT, rel);
        return !fs.existsSync(p) || !fs.readFileSync(p).equals(buf);
      })
      .map(([rel]) => rel),
  ];
  if (drifted.length) {
    console.error("The vendored knot has drifted from upstream. Re-run: npm run sync:knot");
    drifted.forEach((rel) => console.error(`  ${rel}`));
    process.exit(1);
  }
  console.log(`Lumi knot is in sync with ${sha.slice(0, 12)}`);
  process.exit(0);
}

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });
for (const [rel, text] of out) fs.writeFileSync(path.join(DEST, rel), text);
for (const [rel, buf] of assets) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
}
fs.writeFileSync(path.join(DEST, "UPSTREAM.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `Synced ${out.size} modules + ${assets.size} asset from ${path.relative(ROOT, UPSTREAM)} @ ${sha.slice(0, 12)}`,
);
if (dirty) console.warn("⚠️  upstream has uncommitted changes to these files — this sync is not reproducible from that SHA.");
