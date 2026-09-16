// Headless run of a Story Mode story, with real timing and real WebGL/CSS.
//
// The in-app preview pane runs with `document.hidden`, which freezes CSS
// transitions and animations mid-flight — so the photographic stage can only
// be judged honestly in a headless browser that runs the frame loop. This plays
// the story the way a presenter does (→ presses, waiting for each beat to
// settle) and checks what can be measured rather than eyeballed:
//
//   · in scene focus the phone is fully below the frame;
//   · in phone focus it's centred on the screen (±2px);
//   · behind the phone, every room lands on the same darkness (the per-photo
//     scrim), within ±15 % of the rooms' average;
//   · every photo on stage has decoded;
//   · ← snaps with no stage transition running, onto the same state the
//     forward play reached;
//   · pressing → mid-move retargets the phone without a jump.
//
// It also writes a resting frame per beat, a contact sheet, and a frame strip
// through each scene transition, under .scratch/story/.
//
//   node scripts/shoot-story.mjs                    (All-Hands, all checks)
//   node scripts/shoot-story.mjs --reduced          (prefers-reduced-motion)
//   node scripts/shoot-story.mjs --story sarah      (regression: no photo stage)
//
// Needs the dev server up (npm run dev).
import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, []),
);

const BASE = args.url ?? "http://localhost:3000";
const STORY = args.story ?? "allhands";
const OUT = path.resolve(args.out ?? `.scratch/story${STORY === "allhands" ? "" : `-${STORY}`}${args.reduced ? "-reduced" : ""}`);
const W = Number(args.w ?? 1920);
const H = Number(args.h ?? 1080);
const REDUCED = args.reduced === "true";
/** Beats to film frame by frame while their transition plays. */
const STRIPS = new Set((args.strips ?? "phone-rise,saturday,blinds-morning,sunday,train,end").split(",").filter(Boolean));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: REDUCED ? "reduce" : "no-preference",
});
const problems = [];
page.on("pageerror", (e) => problems.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`[console] ${m.text()}`);
  // "Too many active WebGL contexts" / a lost context — the knot leaking one per
  // chat open. (SwiftShader's "GPU stall due to ReadPixels" is our own
  // screenshots reading the canvas back, not a problem, so it isn't matched.)
  else if (m.type() === "warning" && /too many active webgl contexts|context (was )?lost/i.test(m.text())) {
    problems.push(`[warning] ${m.text()}`);
  }
});

const failures = [];
const fail = (msg) => { failures.push(msg); console.log(`  ✗ ${msg}`); };

// ── Reading the page ─────────────────────────────────────────────────────────

const snapshot = () =>
  page.evaluate(() => {
    const s = window.__lumi.getState();
    const d = s.demo;
    const r = document.querySelector('[class*="aspect-[390/844]"]')?.getBoundingClientRect();
    return {
      beat: d.beatIndex,
      id: document.querySelector("[data-beat-id]")?.getAttribute("data-beat-id") ?? null,
      stage: d.stage && {
        photo: d.stage.photo,
        focus: d.stage.focus,
        stamp: d.stage.stamp?.when ?? null,
        glance: d.stage.glance,
        dip: d.stage.dip,
      },
      lights: s.smartRoom.lights.on,
      busy:
        d.storyChat.lumiTyping || d.waChat.lumiTyping || !!d.storyChat.draft || !!d.waChat.draft || !!d.storyChat.tappedReply,
      counts: [d.storyChat.messages.length, d.waChat.messages.length],
      surface: d.surface,
      chat: !!s.chat,
      phone: r && { x: r.x, y: r.y, w: r.width, h: r.height },
      vw: innerWidth,
      vh: innerHeight,
      stageEl: !!document.querySelector(".stage"),
      scrollY: Math.round(scrollY),
      phoneOpacity: +getComputedStyle(document.querySelector(".stage-phone") ?? document.body).opacity,
      moving: document
        .getAnimations()
        .filter((a) => a.constructor.name === "CSSTransition" && a.playState === "running")
        .filter((a) => { const t = a.effect?.target; return t && (t.closest?.(".stage") || t.classList?.contains("stage-phone")); }).length,
      imgs: [...document.querySelectorAll(".stage img")].map((i) => i.complete && i.naturalWidth > 0),
      // Every knot canvas on the page — a disposed knot removes its own, so
      // more than one means a chat mount leaked one.
      knotCanvases: document.querySelectorAll("canvas.lumi-knot-canvas").length,
      // The Lumi knot in the story chat: its mode, and how far its canvas sits
      // from the anchor that mode puts it on (centre offset, size ratio).
      knot: (() => {
        const wrap = document.querySelector("[data-knot]");
        if (!wrap) return null;
        const mode = wrap.getAttribute("data-knot");
        const c = wrap.querySelector("canvas.lumi-knot-canvas")?.getBoundingClientRect();
        const a = mode === "hidden" ? null : document.querySelector(`[data-knot-anchor="${mode === "start" ? "big" : "small"}"]`)?.getBoundingClientRect();
        const r1 = (v) => Math.round(v * 10) / 10;
        return {
          mode,
          opacity: Math.round(+getComputedStyle(wrap).opacity * 100) / 100,
          rect: c && { x: Math.round(c.x), y: Math.round(c.y), w: Math.round(c.width), h: Math.round(c.height) },
          dx: c && a ? r1(c.x + c.width / 2 - (a.x + a.width / 2)) : null,
          dy: c && a ? r1(c.y + c.height / 2 - (a.y + a.height / 2)) : null,
          ratio: c && a ? Math.round((c.width / a.width) * 1000) / 1000 : null,
        };
      })(),
    };
  });

/** Spread of the pixels in a region — a blank knot canvas over the start
 *  screen's soft gradient is near-flat; the knot itself is anything but. */
async function regionStdev(buf, r) {
  const meta = await sharp(buf).metadata();
  const left = Math.max(0, r.x), top = Math.max(0, r.y);
  const width = Math.min(meta.width - left, r.w), height = Math.min(meta.height - top, r.h);
  if (width < 8 || height < 8) return NaN;
  const { channels } = await sharp(buf).extract({ left, top, width, height }).stats();
  return (channels[0].stdev + channels[1].stdev + channels[2].stdev) / 3;
}

/** Per-frame knot sampler, started before a press and read back after the
 *  beat settles: mode, opacity, offset from its anchor, and whether its
 *  transform is transitioning (a glide) that frame. */
const startKnotSampler = () =>
  page.evaluate(() => {
    const t0 = performance.now();
    window.__knot = [];
    // A beat started before this one may still be sampling; stop it, or two
    // samplers interleave frames into the same list.
    window.__knotStop?.();
    let live = true;
    // rAF alone isn't enough: this rig renders a few frames a second, and a
    // follow-up's ~800ms of thinking can fall entirely between two frames.
    // A mode change is also sampled the moment React commits it — by then
    // useKnotPlacement's layout effect has already placed the knot.
    const mo = new MutationObserver(() => { if (live) sample(); });
    const watch = () => {
      const w = document.querySelector("[data-knot]");
      if (w) mo.observe(w, { attributes: true, attributeFilter: ["data-knot"] });
    };
    window.__knotStop = () => { live = false; mo.disconnect(); };
    watch();
    function sample() {
      const wrap = document.querySelector("[data-knot]");
      if (wrap) {
        const mode = wrap.getAttribute("data-knot");
        const c = wrap.querySelector("canvas.lumi-knot-canvas")?.getBoundingClientRect();
        const a = mode === "hidden" ? null : document.querySelector(`[data-knot-anchor="${mode === "start" ? "big" : "small"}"]`)?.getBoundingClientRect();
        const run = document
          .getAnimations()
          .filter((x) => x.constructor.name === "CSSTransition" && x.playState === "running" && x.effect?.target === wrap)
          .map((x) => x.transitionProperty);
        window.__knot.push({
          t: Math.round(performance.now() - t0),
          mode,
          op: +getComputedStyle(wrap).opacity,
          dx: c && a ? c.x + c.width / 2 - (a.x + a.width / 2) : null,
          dy: c && a ? c.y + c.height / 2 - (a.y + a.height / 2) : null,
          ratio: c && a ? c.width / a.width : null,
          w: c ? c.width : null,
          run,
        });
      }
    }
    (function tick() {
      if (!live) return;
      watch(); // the chat — and its knot — may mount mid-beat
      sample();
      if (performance.now() - t0 < 6000) requestAnimationFrame(tick);
      else window.__knotStop();
    })();
  });

/** A beat where Lumi thinks: from the start screen the knot glides into its
 *  loading spot (v7's first question); otherwise it appears there in place.
 *  Either way, once still it sits on the anchor. */
function checkKnotBeat(id, restMode, frames) {
  const loading = frames.filter((f) => f.mode === "loading");
  if (!loading.length) return null;
  const glided = loading.some((f) => f.run.includes("transform"));
  const expectGlide = restMode === "start" && !REDUCED;
  if (glided !== expectGlide) {
    fail(`${id}: the knot ${glided ? "glided" : "jumped"} into its thinking spot — it should ${expectGlide ? "glide from the start screen" : "appear in place"}`);
  }
  const still = loading.filter((f) => !f.run.includes("transform") && f.dx !== null && f.op > 0.5);
  let worst = null;
  let scaleOff = null;
  if (!still.length) fail(`${id}: never caught the knot settled while Lumi was thinking`);
  else {
    worst = Math.round(still.reduce((m, f) => Math.max(m, Math.abs(f.dx), Math.abs(f.dy)), 0) * 10) / 10;
    scaleOff = Math.round(still.reduce((m, f) => Math.max(m, Math.abs(f.ratio - 1)), 0) * 1000) / 1000;
    if (worst > 2 || scaleOff > 0.03) fail(`${id}: thinking knot off its anchor by ${worst}px (size off by ${scaleOff})`);
  }
  return { id, from: restMode, glided, loadingFrames: loading.length, settledFrames: still.length, worstPx: worst, scaleOff, sizePx: still.at(-1)?.w ?? null };
}

/** Wait until nothing has changed for `quiet` ms and no stage transition is
 *  still running. Headless Chromium renders this stage with software WebGL,
 *  where compositing a frame can take hundreds of ms — and a compositor-driven
 *  transition doesn't start until one lands — so a position that hasn't moved
 *  *yet* must not be mistaken for one that has settled. The quiet window is
 *  longer than the story's longest in-beat pause (3s). */
async function settle(maxMs = 20000, quiet = 3300) {
  const t0 = Date.now();
  let last = null;
  let since = Date.now();
  let s;
  while (Date.now() - t0 < maxMs) {
    s = await snapshot();
    const key = JSON.stringify({ ...s, phone: s.phone && Math.round(s.phone.y) });
    if (key !== last) { last = key; since = Date.now(); }
    else if (!s.busy && !s.moving && Date.now() - since >= quiet) return s;
    await page.waitForTimeout(200);
  }
  return s;
}

/** Mean luminance in two bands either side of the phone, mid-height. */
async function bandLuma(buf, p) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bands = [[p.x - 400, p.x - 60], [p.x + p.w + 60, p.x + p.w + 400]];
  let sum = 0, n = 0;
  for (const [a, b] of bands) {
    for (let y = Math.floor(info.height * 0.2); y < info.height * 0.8; y += 3) {
      for (let x = Math.max(0, Math.floor(a)); x < Math.min(info.width, b); x += 3) {
        const o = (y * info.width + x) * info.channels;
        sum += 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
        n++;
      }
    }
  }
  return n ? sum / n : NaN;
}

const runningStageTransitions = () =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.constructor.name === "CSSTransition" && a.playState === "running")
      .filter((a) => {
        const t = a.effect?.target;
        return t && (t.closest?.(".stage") || t.classList?.contains("stage-phone") || t.classList?.contains("stage-rim") || t.hasAttribute?.("data-knot"));
      })
      .map((a) => `${a.transitionProperty} on ${a.effect.target.hasAttribute("data-knot") ? "the knot" : `.${String(a.effect.target.className).split(" ")[0]}`}`),
  );

async function sheet(files, dest, cols, tw) {
  if (!files.length) return;
  const th = Math.round((tw * H) / W);
  const rows = Math.ceil(files.length / cols);
  const composites = await Promise.all(
    files.map(async (f, i) => ({
      input: await sharp(f).resize(tw, th).png().toBuffer(),
      left: (i % cols) * (tw + 8) + 8,
      top: Math.floor(i / cols) * (th + 8) + 8,
    })),
  );
  await sharp({ create: { width: cols * (tw + 8) + 8, height: rows * (th + 8) + 8, channels: 3, background: "#191919" } })
    .composite(composites)
    .png()
    .toFile(dest);
}

// ── Sarah's Day regression: the photo stage must not exist there ─────────────

if (STORY !== "allhands") {
  await page.goto(`${BASE}/?story`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  let knotCanvases = 0;
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(2500);
    knotCanvases = Math.max(knotCanvases, (await snapshot()).knotCanvases);
  }
  const s = await snapshot();
  await page.screenshot({ path: path.join(OUT, "sarah.png") });
  if (s.stageEl) fail("the photo stage is mounted in Sarah's Day");
  if (knotCanvases > 1) fail(`Sarah's Day: ${knotCanvases} knot canvases on the page at once`);
  // Sarah's Day keeps the side panel in the flow: phone centred in (vw − 210).
  const expectX = 210 + (s.vw - 210) / 2;
  const cx = s.phone.x + s.phone.w / 2;
  if (Math.abs(cx - expectX) > 3) fail(`Sarah's Day phone moved: centre ${cx.toFixed(1)}, expected ${expectX.toFixed(1)}`);
  console.log(JSON.stringify({ story: STORY, beat: s.beat, stageEl: s.stageEl, phoneCentre: cx, knotCanvases, failures, problems }, null, 2));
  await browser.close();
  process.exit(failures.length || problems.length ? 1 : 0);
}

// ── All-Hands: play it forward ────────────────────────────────────────────────

await page.goto(`${BASE}/?story=allhands`, { waitUntil: "networkidle" });
const frames = [];
const timelines = {};
const byBeat = [];
const lumas = [];
const knotBeats = [];
const knotStarts = [];
let s = await settle();

for (let step = 0; step < 60; step++) {
  const n = String(s.beat).padStart(2, "0");
  console.log(`beat ${n} ${s.id?.padEnd(22)} focus=${s.stage.focus.padEnd(5)} photo=${String(s.stage.photo).padEnd(13)} stamp=${s.stage.stamp ?? "—"}`);
  byBeat[s.beat] = s;

  const buf = await page.screenshot();
  const file = path.join(OUT, `beat-${n}-${s.id}.png`);
  fs.writeFileSync(file, buf);
  frames.push(file);

  // What must be true at rest.
  if (s.imgs.some((ok) => !ok)) fail(`beat ${n} ${s.id}: a stage photo hasn't decoded`);
  // The page itself must never scroll: a chat scrollIntoView chasing an
  // off-stage phone once dragged it back up the screen.
  if (s.scrollY !== 0) fail(`beat ${n} ${s.id}: the page scrolled by ${s.scrollY}px`);
  // The knot: one at a time, never left thinking, gone once Lumi has answered,
  // and on the start screen sitting exactly on its anchor — and really drawn.
  if (s.knotCanvases > 1) fail(`beat ${n} ${s.id}: ${s.knotCanvases} knot canvases on the page`);
  if (s.knot) {
    const k = s.knot;
    if (k.mode === "loading") fail(`beat ${n} ${s.id}: the knot is still thinking at rest`);
    if (k.mode === "hidden" && k.opacity > 0.02) fail(`beat ${n} ${s.id}: the knot should have faded out (opacity ${k.opacity})`);
    if (k.mode === "start") {
      if (!k.rect) fail(`beat ${n} ${s.id}: no knot canvas on the start screen`);
      else {
        if (k.opacity < 0.98) fail(`beat ${n} ${s.id}: start-screen knot at opacity ${k.opacity}`);
        if (Math.abs(k.dx) > 2 || Math.abs(k.dy) > 2 || Math.abs(k.ratio - 1) > 0.02) {
          fail(`beat ${n} ${s.id}: start-screen knot off its anchor (dx ${k.dx}, dy ${k.dy}, size ×${k.ratio})`);
        }
        if (s.stage.focus === "phone") {
          const sd = await regionStdev(buf, k.rect);
          knotStarts.push({ beat: s.beat, id: s.id, stdev: Math.round(sd * 10) / 10 });
          if (!(sd > 8)) fail(`beat ${n} ${s.id}: the start-screen knot looks blank (pixel stdev ${sd.toFixed(1)})`);
        }
      }
    }
  }
  if (s.stage.focus === "scene") {
    // With reduced motion the phone fades out in place rather than travelling.
    if (REDUCED) { if (s.phoneOpacity > 0.05) fail(`beat ${n} ${s.id}: scene focus but the phone is still visible (opacity ${s.phoneOpacity})`); }
    else if (s.phone.y < s.vh) fail(`beat ${n} ${s.id}: scene focus but the phone is on screen (top ${s.phone.y.toFixed(0)})`);
  }
  if (s.stage.focus === "phone") {
    const off = s.phone.x + s.phone.w / 2 - s.vw / 2;
    if (Math.abs(off) > 2) fail(`beat ${n} ${s.id}: phone ${off.toFixed(1)}px off centre`);
    // Friday is deliberately off the shared target in both directions — darker
    // with the lights off (night), brighter with them on (the lights stay lifted
    // behind the phone) — so it isn't held to the rooms' average.
    if (s.stage.photo !== "ac" && !s.id?.startsWith("end")) lumas.push({ beat: s.beat, id: s.id, photo: s.stage.photo, luma: await bandLuma(buf, s.phone) });
  }

  const before = s.beat;
  // Per-frame choreography: scrim, dip, the phone's offset, the stamp, and the
  // page scroll — read from computed styles, so it doesn't depend on how fast
  // screenshots can be taken.
  await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const ty = (el) => { const m = getComputedStyle(el).transform; return m === "none" ? 0 : Math.round(parseFloat(m.split(",")[5])); };
    const op = (el) => (el ? Math.round(+getComputedStyle(el).opacity * 100) / 100 : null);
    const t0 = performance.now();
    window.__tl = [];
    (function tick() {
      const ph = q(".stage-phone");
      window.__tl.push([Math.round(performance.now() - t0), op(q(".stage-scrim")), op(q(".stage-dip")), ph ? ty(ph) : null, op(q(".stage-stamp-line")), Math.round(scrollY)]);
      if (performance.now() - t0 < 4200) requestAnimationFrame(tick);
    })();
  });
  const restKnotMode = s.knot?.mode ?? null;
  await startKnotSampler();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(60);
  const nextId = await page.evaluate(() => document.querySelector("[data-beat-id]")?.getAttribute("data-beat-id"));
  // Only film a real transition — the last press doesn't change the beat.
  if (STRIPS.has(nextId) && nextId !== s.id) {
    const shots = [];
    for (let i = 0; i < 16; i++) { shots.push(await page.screenshot()); await page.waitForTimeout(110); }
    const strip = shots.map((b, i) => { const f = path.join(OUT, `_strip-${nextId}-${i}.png`); fs.writeFileSync(f, b); return f; });
    await sheet(strip, path.join(OUT, `strip-${nextId}.png`), 8, 360);
    strip.forEach((f) => fs.rmSync(f));
    const tl = await page.evaluate(() => window.__tl);
    timelines[nextId] = tl;
    const every = Math.max(1, Math.floor(tl.length / 12));
    console.log(`  ${nextId} — ${tl.length} frames   t(ms)  scrim  dip  phoneY  stamp  scroll`);
    for (let i = 0; i < tl.length; i += every) console.log(`      ${String(tl[i][0]).padStart(5)}  ${String(tl[i][1]).padStart(5)}  ${String(tl[i][2]).padStart(4)}  ${String(tl[i][3]).padStart(6)}  ${String(tl[i][4]).padStart(5)}  ${tl[i][5]}`);
    if (tl.some((r) => r[5] !== 0)) fail(`${nextId}: the page scrolled during the transition`);
  }
  s = await settle();
  if (s.beat === before) break; // the last beat
  const kb = checkKnotBeat(s.id, restKnotMode, await page.evaluate(() => window.__knot ?? []));
  if (kb) {
    knotBeats.push(kb);
    console.log(`  knot: ${kb.from ?? "—"} → thinking ${kb.glided ? "(glide)" : "(in place)"}  ${kb.sizePx?.toFixed(1) ?? "?"}px  off ${kb.worstPx ?? "?"}px`);
  }
}

await sheet(frames, path.join(OUT, "contact-sheet.png"), 6, 400);

// ── Consistent darkness behind the phone ─────────────────────────────────────
const perPhoto = {};
for (const l of lumas) (perPhoto[l.photo] ??= []).push(l.luma);
const photoMeans = Object.fromEntries(Object.entries(perPhoto).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]));
const avg = Object.values(photoMeans).reduce((a, b) => a + b, 0) / Object.values(photoMeans).length;
for (const [photo, m] of Object.entries(photoMeans)) {
  if (Math.abs(m - avg) / avg > 0.15) fail(`scrim: ${photo} sits at luma ${m.toFixed(1)} behind the phone vs rooms' average ${avg.toFixed(1)} (>±15 %)`);
}

// ── ← snaps with nothing in motion, onto the forward-played state ─────────────
async function snapCheck(label, target) {
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(30);
  const during = await runningStageTransitions();
  await page.waitForTimeout(250);
  const after = await runningStageTransitions();
  const got = await snapshot();
  const want = byBeat[target];
  const same =
    got.beat === target &&
    got.stage.photo === want.stage.photo &&
    got.stage.focus === want.stage.focus &&
    got.stage.stamp === want.stage.stamp &&
    got.lights === want.lights &&
    Math.abs(got.phone.y - want.phone.y) < 2 &&
    (got.knot?.mode ?? null) === (want.knot?.mode ?? null);
  if (got.knot && got.knot.mode !== "hidden" && got.knot.rect && (Math.abs(got.knot.dx) > 2 || Math.abs(got.knot.dy) > 2)) {
    fail(`snap ${label}: the knot landed off its anchor (dx ${got.knot.dx}, dy ${got.knot.dy})`);
  }
  if (during.length) fail(`snap ${label}: transitions running during the snap: ${during.join(", ")}`);
  if (after.length) fail(`snap ${label}: transitions started after the snap: ${after.join(", ")}`);
  if (!same) fail(`snap ${label}: landed on ${JSON.stringify(got.stage)} lights=${got.lights}, forward play had ${JSON.stringify(want.stage)} lights=${want.lights}`);
  await page.screenshot({ path: path.join(OUT, `snap-${label}.png`) });
  return { label, target, during, after, same };
}

const last = s.beat;
const snaps = [];
snaps.push(await snapCheck("from-end", last - 1));
// A mid-story snap onto the blinds beat: jump past it, then step back onto it.
const blinds = byBeat.findIndex((b) => b?.id === "blinds-morning");
await page.evaluate((n) => window.__lumi.getState().setBeatIndex(n), blinds + 1);
await page.waitForTimeout(3000);
snaps.push(await snapCheck("blinds", blinds));
// And onto a start screen, where the knot has to land on its anchor at once.
const askOpen = byBeat.findIndex((b) => b?.id === "ask-lumi-open");
await page.evaluate((n) => window.__lumi.getState().setBeatIndex(n), askOpen + 1);
await page.waitForTimeout(3000);
snaps.push(await snapCheck("ask-lumi-open", askOpen));

let mashReport = { skipped: "reduced motion — the phone fades rather than travels, so there is no move to retarget" };
if (!REDUCED) {
  // ── Mash: → while the phone is mid-move must retarget it, not restart it ──────
  // Caught genuinely mid-sink, the offset is read on either side of the second
  // press. A transition carries on from wherever it is; a keyframe would jump
  // back to its own start. Sampling-rate independent, which matters here.
  const lunchMap = byBeat.findIndex((b) => b?.id === "lunch-map");
  await page.evaluate((n) => window.__lumi.getState().setBeatIndex(n), lunchMap + 1);
  await page.waitForTimeout(2500);
  await page.keyboard.press("ArrowLeft"); // snap back onto lunch-map, phone up
  await page.waitForTimeout(800);
  const phoneOffset = () =>
    page.evaluate(() => {
      const m = getComputedStyle(document.querySelector(".stage-phone")).transform;
      return m === "none" ? 0 : parseFloat(m.split(",")[5]);
    });
  await page.keyboard.press("ArrowRight"); // sunday: the phone starts to sink…
  let mid = 0;
  for (const t = Date.now(); Date.now() - t < 8000; ) {
    mid = await phoneOffset();
    if (mid > 200 && mid < 900) break;
    await page.waitForTimeout(15);
  }
  const before = await phoneOffset();
  await page.keyboard.press("ArrowRight"); // …and is called back up while still moving
  let after = before;
  for (const t = Date.now(); Date.now() - t < 4000; ) {
    const focus = await page.evaluate(() => window.__lumi.getState().demo.stage.focus);
    if (focus === "phone") { after = await phoneOffset(); break; }
    await page.waitForTimeout(5);
  }
  const mash = await settle();
  const final = await phoneOffset();
  const jump = Math.abs(after - before);
  if (!(before > 200 && before < 900)) fail(`mash: couldn't catch the phone mid-sink (offset ${before.toFixed(0)}px)`);
  // A retarget continues from the current value (≤ a frame of travel apart);
  // a restart lands on 0 or ~1019 instantly.
  if (jump > 80) fail(`mash: the phone jumped ${jump.toFixed(0)}px when called back mid-sink`);
  if (mash.stage.focus !== "phone" || Math.abs(final) > 1) fail(`mash: ended in ${mash.stage.focus} focus at offset ${final.toFixed(0)}px`);
  await page.screenshot({ path: path.join(OUT, "mash-end.png") });
  mashReport = { caughtAt: Math.round(before), afterPress: Math.round(after), jump: Math.round(jump), final: Math.round(final) };
}

// Every chat open/close and snap above mounted and disposed a knot; there must
// still be at most one.
const finalKnotCanvases = (await snapshot()).knotCanvases;
if (finalKnotCanvases > 1) fail(`after the run: ${finalKnotCanvases} knot canvases on the page`);

await browser.close();

const report = {
  story: STORY,
  reduced: REDUCED,
  beats: last + 1,
  lumaBehindPhone: Object.fromEntries(Object.entries(photoMeans).map(([k, v]) => [k, Math.round(v * 10) / 10])),
  lumaAverage: Math.round(avg * 10) / 10,
  snaps,
  mash: mashReport,
  knot: { starts: knotStarts, thinking: knotBeats, finalCanvases: finalKnotCanvases },
  // Per-frame choreography through each filmed transition:
  // [t ms, scrim opacity, dip opacity, phone offset px, stamp opacity, page scrollY]
  timelines,
  failures,
  problems: problems.slice(0, 10),
  out: path.relative(process.cwd(), OUT),
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("\n" + JSON.stringify(report, null, 2));
process.exit(failures.length || problems.length ? 1 : 0);
