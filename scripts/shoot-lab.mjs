// Headless capture of the chat lab, with real WebGL (SwiftShader).
//
// Two jobs, one tool:
//
//  1. Verification. The in-app preview pane runs with `document.hidden`, which
//     stops rAF — and react-three-fiber needs a frame even to *size* its
//     canvas, so the cube never initialises there at all. A headless Chromium
//     runs the loop normally, so this is the only honest way to look at the
//     scene during development.
//  2. Baking. The story ships pre-rendered frames rather than a live renderer,
//     and they have to be captured from this route at the prototype's real
//     geometry — bake upstream and you are re-cropping someone else's
//     composition. `--frames` writes a sequence for exactly that.
//
// Needs the dev server up (npm run dev).
//
//   node scripts/shoot-lab.mjs --out .scratch/lab.png
//   node scripts/shoot-lab.mjs --state docking --frames 6 --interval 120 --sheet
//   node scripts/shoot-lab.mjs --eval "__lumiScene.step(60)"
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, []),
);

const url = args.url ?? "http://localhost:3000/lab";
const out = args.out ?? ".scratch/lab.png";
const w = Number(args.w ?? 1280);
const h = Number(args.h ?? 900);
const dpr = Number(args.dpr ?? 2);
const wait = Number(args.wait ?? 3500);
const frames = Number(args.frames ?? 1);
const interval = Number(args.interval ?? 250);
/** Click one of the lab's state buttons before capturing. */
const state = args.state;
const evalJs = args.eval;
const evalWait = Number(args.evalWait ?? 400);
const sheet = args.sheet === "true";
/** Capture just the phone, not the whole lab. */
const phoneOnly = args.phone === "true";
/** Capture one element by CSS selector — the sheet, for baking and for measuring. */
const sel = args.sel;

mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});
const page = await browser.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: dpr,
  reducedMotion: args.reduced === "true" ? "reduce" : "no-preference",
});

const problems = [];
page.on("pageerror", (e) => problems.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`[error] ${m.text()}`);
});

await page.goto(url, { waitUntil: "networkidle" });
if (state) {
  await page.getByRole("button", { name: new RegExp(`^${state}`, "i") }).first().click();
}
await page.waitForTimeout(wait);
if (evalJs) {
  await page.evaluate(evalJs);
  await page.waitForTimeout(evalWait);
}

// Did the renderer actually draw? A canvas that never issued a draw call looks
// identical to a broken scene in a screenshot, so assert it rather than guess.
const health = await page.evaluate(() => {
  const s = window.__lumiScene;
  if (!s) return { ok: false, why: "no __lumiScene handle — the r3f root never initialised" };
  const r = s.state.gl.info.render;
  return {
    ok: r.calls > 0,
    why: r.calls > 0 ? null : "renderer initialised but drew nothing",
    calls: r.calls,
    triangles: r.triangles,
    children: s.state.scene.children.length,
  };
});

const target = sel ? page.locator(sel).first() : phoneOnly ? page.locator("main").first() : page;
const written = [];
for (let i = 1; i <= frames; i++) {
  const f = frames > 1 ? out.replace(/\.png$/, `-${i}.png`) : out;
  await target.screenshot({ path: f });
  written.push(f);
  if (i < frames) await page.waitForTimeout(interval);
}

if (sheet && written.length > 1) {
  const imgs = written.map(
    (f) => `<img src="data:image/png;base64,${readFileSync(f).toString("base64")}" style="height:520px;display:block">`,
  );
  const p2 = await browser.newPage({ viewport: { width: 1600, height: 560 }, deviceScaleFactor: 1 });
  await p2.setContent(
    `<body style="margin:0;background:#191919;display:flex;gap:8px;padding:8px">${imgs.join("")}</body>`,
  );
  await p2.screenshot({ path: out.replace(/\.png$/, "-sheet.png"), fullPage: true });
  await p2.close();
}

await browser.close();

console.log(JSON.stringify({ written, health, problems: problems.slice(0, 8) }, null, 2));
if (!health.ok) process.exitCode = 1;
