#!/usr/bin/env node
// Pull the Lumi cube + its light-through-a-curtain background out of
// numa-lumi-branding-v2 and into this repo.
//
// branding-v2 is the upstream and the only place the cube's *look* is decided.
// This repo decides how it sits inside a 368px chat sheet — nothing more. That
// split only survives if re-syncing is a single command, so:
//
//   • vendor/ is written from upstream verbatim and is NEVER hand-edited.
//     Anything you want changed about the cube itself, change in branding-v2
//     and re-run this.
//   • overrides/ holds the few modules we deliberately replace (the DialKit
//     panel becomes a defaults-only stub). The script copies them in last.
//   • codemods below are the small mechanical fixes Vite→Next needs. Keep this
//     list short; if it grows, fix it upstream instead.
//   • UPSTREAM.json records the commit we copied from, so "which cube is in
//     the demo?" always has an answer.
//
// Usage:
//   node scripts/sync-lumi3d.mjs [path-to-branding-v2]     (default: ../numa-lumi-branding-v2)
//   node scripts/sync-lumi3d.mjs --check                   (CI: fail if vendor/ drifted)

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEST = path.join(ROOT, "components/lumi3d/vendor");
const OVERRIDES = path.join(ROOT, "components/lumi3d/overrides");

const args = process.argv.slice(2);
const check = args.includes("--check");
const upstreamArg = args.find((a) => !a.startsWith("--"));
const UPSTREAM = path.resolve(ROOT, upstreamArg ?? "../numa-lumi-branding-v2");

/** Files copied verbatim from upstream `src/`, keyed by their path there. */
const FILES = [
  "directions/types.ts",
  "directions/cube/index.tsx",
  "directions/cube/shaders.ts",
  "directions/cube/motion.ts",
  "directions/cube/air.ts",
  "directions/cube/wall.ts",
  "directions/cube/light.ts",
  "lib/cities.ts",
  "shell/rig.ts",
];

/**
 * Mechanical Vite→Next fixes. Each is [description, find, replace]; every one
 * must either apply or be listed in OPTIONAL, so an upstream rename is a loud
 * failure rather than a silently un-patched file.
 */
const CODEMODS = [
  [
    "import.meta.env.DEV → process.env.NODE_ENV (Turbopack defines no import.meta.env)",
    /!import\.meta\.env\.DEV/g,
    'process.env.NODE_ENV === "production"',
  ],
  [
    "import.meta.env.DEV → process.env.NODE_ENV",
    /import\.meta\.env\.DEV/g,
    'process.env.NODE_ENV !== "production"',
  ],
];
/** Codemods allowed to match nothing (upstream may already be clean). */
const OPTIONAL = new Set([0, 1]);

const BANNER = (rel, sha) =>
  `// ⚠️  VENDORED — DO NOT EDIT.\n` +
  `// Copied verbatim from numa-lumi-branding-v2 src/${rel} @ ${sha.slice(0, 12)}\n` +
  `// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.\n`;

const OVERRIDE_BANNER = (rel) =>
  `// ⚠️  GENERATED — DO NOT EDIT.\n` +
  `// Written from components/lumi3d/overrides/${rel} by scripts/sync-lumi3d.mjs.\n` +
  `// This module deliberately replaces the upstream one. Edit the override.\n`;

function listOverrides(dir, base = "") {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    return e.isDirectory() ? listOverrides(path.join(dir, e.name), rel) : [rel];
  });
}

function build() {
  if (!fs.existsSync(path.join(UPSTREAM, "src"))) {
    throw new Error(
      `No branding-v2 at ${UPSTREAM}.\n` +
        `Pass its path: node scripts/sync-lumi3d.mjs ../numa-lumi-branding-v2`,
    );
  }

  let sha = "unknown";
  let dirty = false;
  try {
    sha = execFileSync("git", ["-C", UPSTREAM, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    dirty =
      execFileSync("git", ["-C", UPSTREAM, "status", "--porcelain", "src"], {
        encoding: "utf8",
      }).trim().length > 0;
  } catch {
    /* upstream may not be a git repo; the SHA is a nicety, not a requirement */
  }

  const out = new Map();
  const applied = new Set();

  for (const rel of FILES) {
    const src = path.join(UPSTREAM, "src", rel);
    if (!fs.existsSync(src)) throw new Error(`Upstream file missing: src/${rel}`);
    let text = fs.readFileSync(src, "utf8");
    CODEMODS.forEach(([, find, replace], i) => {
      if (find.test(text)) applied.add(i);
      find.lastIndex = 0;
      text = text.replace(find, replace);
    });
    out.set(rel, BANNER(rel, sha) + "\n" + text);
  }

  CODEMODS.forEach(([desc], i) => {
    if (!applied.has(i) && !OPTIONAL.has(i)) {
      throw new Error(`Codemod never matched — upstream probably changed:\n  ${desc}`);
    }
  });

  for (const rel of listOverrides(OVERRIDES)) {
    const text = fs.readFileSync(path.join(OVERRIDES, rel), "utf8");
    out.set(rel, OVERRIDE_BANNER(rel) + "\n" + text);
  }

  const manifest = {
    upstream: path.relative(ROOT, UPSTREAM),
    commit: sha,
    dirty,
    syncedAt: new Date().toISOString(),
    files: Object.fromEntries(
      [...out].map(([rel, text]) => [rel, createHash("sha256").update(text).digest("hex").slice(0, 16)]),
    ),
  };
  return { out, manifest, sha, dirty };
}

const { out, manifest, sha, dirty } = build();

if (check) {
  const drifted = [...out].filter(([rel, text]) => {
    const p = path.join(DEST, rel);
    return !fs.existsSync(p) || fs.readFileSync(p, "utf8") !== text;
  });
  if (drifted.length) {
    console.error("vendor/ has drifted from upstream. Re-run: node scripts/sync-lumi3d.mjs");
    drifted.forEach(([rel]) => console.error(`  ${rel}`));
    process.exit(1);
  }
  console.log(`vendor/ is in sync with ${sha.slice(0, 12)}`);
  process.exit(0);
}

fs.rmSync(DEST, { recursive: true, force: true });
for (const [rel, text] of out) {
  const p = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}
fs.writeFileSync(path.join(DEST, "UPSTREAM.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`Synced ${out.size} files from ${path.relative(ROOT, UPSTREAM)} @ ${sha.slice(0, 12)}`);
if (dirty) console.warn("⚠️  upstream src/ has uncommitted changes — this sync is not reproducible from that SHA.");
