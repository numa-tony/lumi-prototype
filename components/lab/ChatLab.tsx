"use client";

// The chat lab — a bench for the Lumi chat's design, at real device size.
//
// It drives the *real* components, not copies of them. What you tune here is
// what ships; there is no second implementation to keep in step.
//
// Two things it deliberately does NOT do:
//  · No shader dials. The cube's own look is decided in numa-lumi-branding-v2
//    and arrives through `npm run sync:lumi3d`. Two live panels editing one
//    shader is how the two repos drift.
//  · No story playback. Beats belong to StoryDirector; this is for judging a
//    single moment and the transition either side of it.
import { useState } from "react";
import { PhoneFrame } from "@/components/device/PhoneFrame";
import { IDLE_CUBE, LumiStartScreen, START_LAYOUT } from "@/components/chat/lumi/LumiStartScreen";
import { DEFAULT_COMPOSITION } from "@/components/lumi3d/CubeScene";
import { CubeStage } from "@/components/lumi3d/CubeStage";
import type { Backdrop } from "@/components/lumi3d/CubeScene";
import { CITIES } from "@/components/lumi3d/vendor/lib/cities";
import { GUEST } from "@/lib/mock/guest";

/**
 * The states worth judging. The cube's behaviour across this list is the whole
 * question — a glass cube that reads beautifully on an empty screen has to
 * survive a thread scrolling over it.
 */
const STATES = [
  { id: "idle", label: "Idle", hint: "Figma 7274-12724" },
  { id: "typing", label: "Typing", hint: "draft in the field" },
  { id: "docking", label: "Docking", hint: "first message sent" },
  { id: "thread", label: "Thread", hint: "background gone to white" },
] as const;
type StateId = (typeof STATES)[number]["id"];

/** Where the scene goes per state. Docking shrinks the cube and lifts it out of the way. */
const SCENE: Record<StateId, { scale: number; offsetX: number; offsetY: number; fade: number }> = {
  // Measured against the frame — see IDLE_CUBE.
  idle: { scale: IDLE_CUBE.scale, offsetX: IDLE_CUBE.offsetX, offsetY: IDLE_CUBE.offsetY, fade: 0 },
  typing: { scale: IDLE_CUBE.scale, offsetX: 0, offsetY: IDLE_CUBE.offsetY, fade: 0 },
  // Docked: a small mark up in the top-left, where a thread's first line
  // clears it. Derived from the idle pose — 1.89 world units up and 1.12 left
  // is the top-left corner at this camera.
  docking: { scale: 0.18, offsetX: -1.12, offsetY: 2.84, fade: 0.55 },
  thread: { scale: 0.18, offsetX: -1.12, offsetY: 2.84, fade: 1 },
};

const STARTERS = [
  "What's the WiFi password?",
  "How does the coffee machine work?",
  "Can you turn on the lights?",
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-[11px] text-white/50">
        <span>{label}</span>
        <span className="tabular-nums text-white/80">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--color-numa)]"
      />
    </label>
  );
}

/**
 * The URL is part of the bench: `?state=docking&scale=0.7&y=0.6` opens on an
 * exact pose. That is what makes the headless capture script useful — it can
 * ask for a composition without anyone driving a slider, which is how these
 * numbers get measured against the frame and, later, baked.
 */
function fromQuery<T extends Record<string, number>>(base: T): T {
  if (typeof window === "undefined") return base;
  const q = new URLSearchParams(window.location.search);
  const out = { ...base };
  for (const k of Object.keys(base) as (keyof T)[]) {
    const v = q.get(String(k));
    if (v !== null && v !== "" && !Number.isNaN(Number(v))) out[k] = Number(v) as T[keyof T];
  }
  return out;
}

export function ChatLab() {
  const [state, setState] = useState<StateId>(() => {
    if (typeof window === "undefined") return "idle";
    const s = new URLSearchParams(window.location.search).get("state");
    return (STATES.find((x) => x.id === s)?.id ?? "idle") as StateId;
  });
  const [scene, setScene] = useState(() => {
    const s = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("state");
    const base = SCENE[(STATES.find((x) => x.id === s)?.id ?? "idle") as StateId];
    // short aliases so a capture command stays readable
    const q = fromQuery({ scale: base.scale, x: base.offsetX, y: base.offsetY, fade: base.fade });
    return { scale: q.scale, offsetX: q.x, offsetY: q.y, fade: q.fade };
  });
  const [layout, setLayout] = useState(() => fromQuery(START_LAYOUT));
  const [cityId, setCityId] = useState(
    () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("city") ?? "berlin",
  );
  const [frozen, setFrozen] = useState(false);
  /** `?chrome=0` renders the scene alone — no greeting, starters or composer.
   *  It is how the cube gets measured against the frame without type in the
   *  way, and how the scene layer gets baked on its own. */
  const [backdrop, setBackdrop] = useState<Backdrop>(
    () =>
      (new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("backdrop") ===
      "gradient"
        ? "gradient"
        : "field") as Backdrop,
  );
  const [gradient, setGradient] = useState(() => fromQuery({ pinkStop: 0.34, sageStop: 0.86, lobe: 0.55 }));
  const [chrome] = useState(
    () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("chrome") !== "0",
  );
  const [pressed, setPressed] = useState<string | null>(null);

  /** Switching state resets the scene to that state's pose, so the sliders
   *  always describe what you're looking at. */
  const goto = (id: StateId) => {
    setState(id);
    setScene(SCENE[id]);
  };

  const draft = state === "typing" ? "Can you turn on the lights?" : "";

  return (
    <div className="flex min-h-dvh bg-[#1a1a1a] text-white">
      {/* ── controls ─────────────────────────────────────────────────────── */}
      <aside className="flex w-[260px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-white/10 p-5">
        <div>
          <h1 className="text-[15px] font-semibold">Chat lab</h1>
          <p className="mt-1 text-[11px] leading-4 text-white/40">
            The real chat components at device size. The cube&rsquo;s look is tuned in
            branding-v2 and synced; these are composition knobs only.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] uppercase tracking-wide text-white/40">State</h2>
          {STATES.map((s) => (
            <button
              key={s.id}
              onClick={() => goto(s.id)}
              className={`flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors ${
                state === s.id ? "bg-[var(--color-numa)] text-black" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-[13px]">{s.label}</span>
              <span className={`text-[10px] ${state === s.id ? "text-black/60" : "text-white/35"}`}>{s.hint}</span>
            </button>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] uppercase tracking-wide text-white/40">Backdrop</h2>
          <div className="flex gap-1">
            {([
              { id: "field", label: "Lit canvas", hint: "7274-12724" },
              { id: "gradient", label: "Pink → sage", hint: "7206-14806" },
            ] as const).map((b) => (
              <button
                key={b.id}
                onClick={() => setBackdrop(b.id)}
                className={`flex-1 rounded-md px-2 py-1.5 text-left transition-colors ${
                  backdrop === b.id ? "bg-white/90 text-black" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="block text-[12px]">{b.label}</span>
                <span className={`block text-[9px] ${backdrop === b.id ? "text-black/50" : "text-white/35"}`}>
                  {b.hint}
                </span>
              </button>
            ))}
          </div>
          {backdrop === "gradient" && (
            <div className="mt-1 flex flex-col gap-3">
              <Slider label="pink stop" value={gradient.pinkStop} min={0.05} max={0.7} step={0.01}
                onChange={(v) => setGradient((g) => ({ ...g, pinkStop: v }))} />
              <Slider label="sage stop" value={gradient.sageStop} min={0.5} max={1} step={0.01}
                onChange={(v) => setGradient((g) => ({ ...g, sageStop: v }))} />
              <Slider label="pink lobe" value={gradient.lobe} min={0} max={1.2} step={0.01}
                onChange={(v) => setGradient((g) => ({ ...g, lobe: v }))} />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase tracking-wide text-white/40">Cube</h2>
          <Slider label="scale" value={scene.scale} min={0.1} max={2} step={0.01}
            onChange={(v) => setScene((s) => ({ ...s, scale: v }))} />
          <Slider label="offset x" value={scene.offsetX} min={-3} max={3} step={0.05}
            onChange={(v) => setScene((s) => ({ ...s, offsetX: v }))} />
          <Slider label="offset y" value={scene.offsetY} min={-3} max={3} step={0.05}
            onChange={(v) => setScene((s) => ({ ...s, offsetY: v }))} />
          <Slider label="background → white" value={scene.fade} min={0} max={1} step={0.01}
            onChange={(v) => setScene((s) => ({ ...s, fade: v }))} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase tracking-wide text-white/40">Layout</h2>
          <Slider label="greeting top" value={layout.greetingTop} min={200} max={500} step={1}
            onChange={(v) => setLayout((l) => ({ ...l, greetingTop: v }))} />
          <Slider label="subtitle top" value={layout.subtitleTop} min={240} max={560} step={1}
            onChange={(v) => setLayout((l) => ({ ...l, subtitleTop: v }))} />
          <Slider label="starters top" value={layout.startersTop} min={400} max={720} step={1}
            onChange={(v) => setLayout((l) => ({ ...l, startersTop: v }))} />
          <Slider label="composer foot" value={layout.composerFoot} min={0} max={64} step={1}
            onChange={(v) => setLayout((l) => ({ ...l, composerFoot: v }))} />
          <Slider label="composer gutter" value={layout.composerGutter} min={0} max={40} step={1}
            onChange={(v) => setLayout((l) => ({ ...l, composerGutter: v }))} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] uppercase tracking-wide text-white/40">Scene</h2>
          <label className="flex flex-col gap-1 text-[11px] text-white/50">
            City accent
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="rounded-md bg-white/10 px-2 py-1.5 text-[12px] text-white"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id} className="text-black">
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[12px] text-white/70">
            <input type="checkbox" checked={frozen} onChange={(e) => setFrozen(e.target.checked)} />
            Frozen (no WebGL)
          </label>
        </section>

        <details className="text-[11px] text-white/40">
          <summary className="cursor-pointer">Values</summary>
          <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-2 text-[10px] leading-4">
{JSON.stringify({ state, backdrop, scene, gradient, layout }, null, 2)}
          </pre>
        </details>
      </aside>

      {/* ── stage ────────────────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center p-3">
        <PhoneFrame>
          {/* The chat sheet's own chrome, matching ChatSheet: 10px from the top
              of the screen area, 38px top radius, Elevation shadow, grabber. */}
          <div className="relative min-h-0 flex-1">
            <div
              data-lab-sheet
              className="absolute inset-x-0 bottom-0 top-[10px] flex flex-col overflow-hidden rounded-t-[38px] bg-surface shadow-[0px_15px_75px_0px_rgba(0,0,0,0.18)]"
            >
              <div className="relative z-10 flex shrink-0 justify-center pt-3">
                <div className="h-[5px] w-9 rounded-full bg-[#ccc]" />
              </div>
              {!chrome ? (
                <CubeStage
                  composition={{ ...DEFAULT_COMPOSITION, scale: scene.scale, offsetX: scene.offsetX, offsetY: scene.offsetY }}
                  backdrop={backdrop}
                  gradient={gradient}
                  fade={scene.fade}
                  cityId={cityId}
                />
              ) : state === "thread" ? (
                <ThreadPlaceholder />
              ) : (
                <LumiStartScreen
                  name={GUEST.firstName}
                  starters={STARTERS}
                  pressedStarter={pressed}
                  onStarter={(s) => {
                    setPressed(s);
                    setTimeout(() => setPressed(null), 380);
                  }}
                  draft={draft}
                  cubeComposition={{
                    ...DEFAULT_COMPOSITION,
                    scale: scene.scale,
                    offsetX: scene.offsetX,
                    offsetY: scene.offsetY,
                  }}
                  backdrop={backdrop}
                  gradient={gradient}
                  sceneFade={scene.fade}
                  frozen={frozen}
                  cityId={cityId}
                  layout={layout}
                />
              )}
            </div>
          </div>
        </PhoneFrame>
      </main>
    </div>
  );
}

/** Stand-in for the conversation, until the message list moves onto the shared
 *  chrome. It exists to answer one question: does the docked cube survive a
 *  thread scrolling under it? */
function ThreadPlaceholder() {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-6 px-6 pb-6">
      <p className="text-[16px] font-light leading-[22px] text-text">
        The lights are on — I&rsquo;ve set them to warm.
      </p>
      <div className="self-end rounded-[20px] bg-surface-muted px-4 py-2.5 text-[15px] font-light text-text">
        Can you turn on the lights?
      </div>
      <p className="text-[13px] text-text-disabled">Thread chrome lands here next.</p>
    </div>
  );
}
