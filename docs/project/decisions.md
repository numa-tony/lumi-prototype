# Technical Decisions — Lumi Prototype

Decisions made during prototype development. Read before changing an established pattern.

---

## FAB gradient border — `::before` technique

**Chosen:** CSS `::before` pseudo-element at `inset: -2px; z-index: -1; background: gradient`.
The outer wrapper has `position: relative` (from `.fab-border` class in globals.css) but
NO stacking context (no backdrop-filter, no z-index set). This keeps `::before` in the
ancestor stacking context so it renders below the outer wrapper, not inside it.
The inner div with `background: rgba(255,255,255,0.85)` + `backdrop-filter: blur(7px)` +
`overflow: hidden` + `border-radius: 16px` covers the gradient center.

**CSS class:** `.fab-border` in `app/globals.css`. Border radius on `::before` = element
radius + 2px (e.g. element=16px → ::before=18px).

**Outer wrapper must NOT have:** `overflow: hidden` (clips ::before) or `backdrop-filter`
(creates stacking context, gradient bleeds through).

**Prior approach:** `mask-composite: exclude` with `padding-box` (also correct, clean corners,
but more verbose). User explicitly requested switching to the foolishdeveloper.com technique.

---

## Bottom nav icons — inline SVG paths

**Chosen:** SVG path data inlined in `BottomNav.tsx`, `fill="currentColor"`. No icon library.
Paths extracted directly from Figma DS export (masks removed — viewBox clips to 24×24
identically). Active state uses filled/heavier path variant; inactive uses outlined variant.
Color driven by Tailwind class on parent button: `text-text` (active) / `text-text-secondary` (inactive).

**Why not an icon library:** Figma exports the exact DS paths. Importing a library would
introduce paths that may not match the DS exactly.

---

## State management — Zustand

Single `useApp()` hook from `lib/store.ts`. No React Context, no Redux.
Sufficient for prototype scope. Store shape: `{ screen, chat, go, openChat, closeChat }`.

---

## AI model — Gemini free tier

AI SDK v6 with Gemini. Model is swappable — not hardcoded. Configuration in `lib/ai/`.
Free tier is intentional for prototype (no API cost). Swap to Claude or GPT-4 when needed.

---

## Mock data — static, no backend

All data in `lib/mock/` (threads, trips, properties). No backend, no auth, no real API calls.
Prototype validates UX, not data infrastructure. Real integration is a production concern.

---

## Chat sheet — bottom sheet, not full-screen push

`ChatSheet` slides up from bottom (spring: damping 32, stiffness 320) as an overlay over the
current screen. `top-[10px]` leaves a sliver of the underlying screen. `rounded-t-[38px]`.
The underlying screen dims with `bg-black/30` backdrop (tap to close).

**Why overlay not navigation:** The chat is ambient/contextual — it knows what screen the
guest was on when they tapped FAB. A navigation push would lose that context and break
the back-stack mental model.

---

## ThreadView — idle vs keyboard vs active modes

Three distinct layout states controlled by `inputFocused` and whether messages exist:
- **Idle** (`isEmpty && !inputFocused`): Numa wordmark centered, large Lumi orb, "Ask anything" input with microphone
- **Keyboard** (`isEmpty && inputFocused`): suggestion starters replace orb, iOS keyboard visual, send arrow
- **Active** (`!isEmpty`): standard chat UI — scrollable message list, composer at bottom

Visual iOS keyboard (`FakeKeyboard`) uses `onMouseDown + e.preventDefault()` pattern so
tapping keyboard keys doesn't steal focus from the textarea. Real keyboard still works.

---

## Story Mode — a registry, not a second engine

`STORIES` in `lib/demo/stories.ts` keyed by `demo.storyId`. Adding a story is a
beats file plus a registry entry; the runner, stage and store are shared.

**Sarah's Day is frozen.** Its `STORY` array in `lib/demo/story.ts` is what the
presenter rehearsed. Shared *visual* upgrades (widgets, screens, chat styling)
are expected to flow into it — its **beats** are not to change. When touching the
engine, diff that array to prove it's byte-identical:

```bash
git show HEAD:lib/demo/story.ts | sed -n '/^export const STORY/,$p' > /tmp/a
sed -n '/^export const STORY/,$p' lib/demo/story.ts > /tmp/b && diff /tmp/a /tmp/b
```

`applyStep` has an exhaustiveness guard (`const never: never = step`), so a new
Step kind without a handler is a compile error rather than a step that silently
does nothing on stage.

`snapToBeat` cancels any beat still playing before it replays. Without that,
pressing `←` mid-beat let the old beat's remaining steps land on top of the snap.

## Story surfaces use CSS, not Framer Motion

The WhatsApp / iOS home / lock surfaces, the Dynamic Island morph and the
send-button swap are plain CSS (keyframes or transitions), even though the rest
of the app uses Framer Motion.

**Why:** Framer's springs are rAF-driven, and browsers stop rAF in a background
tab. A surface that fails to appear because the presenter alt-tabbed is a broken
demo. CSS transitions have the same limitation *in flight*, but they resolve to
a correct resting state — and anything whose visibility depends on an animation
finishing is a liability on stage.

Corollary: don't add a transition to a **state** change (the mic → send swap had
one; it left the button a state behind when the clock froze).

## No backdrop-filter inside the phone frame

The Figma composer specifies `backdrop-blur-[2px]`. It is deliberately **not**
implemented. A backdrop-filter region samples everything painted behind it —
including the black bezel outside the phone's rounded clip — then gets clipped,
smearing grey into the bottom corners with a visible seam at the filter's edge.
The composer sits on the sheet's opaque white and has nothing to blur anyway.

## Island and widget geometry as percentages

Figma artboards are 402×874; the phone's screen is 368×822. Sizes for the
Dynamic Island and Live Activity are expressed as **percentages of the artboard**
so they track the frame at any render size, rather than px tuned to one width.
An early pass scaled from 402 instead of 368 and everything sat ~9% too large.

The expanded island is 91% of the screen width, so its open spring overshoots
mostly in **height** (~8%); more than ~1% on width clips the display's rounded
corners. Closing doesn't bounce — iOS doesn't bounce a Live Activity shut.

## Per-story app data

`useStay()` (`lib/demo/stay.ts`) gives Explore / My Trips / Trip Detail / Your
room the running story's stay. All-Hands shows Berlin Friedrichshain, Jul 9–12,
and hides the trip card entirely on the train home; everything else — including
Sarah's Day — sees the default mock. Stories declare `initialSurface` so the
first painted frame is right, with no flash of the app before beat 0 runs.

`STORIES.allhands.scenes = false` keeps that story on a black stage. The beats
still drive `smartRoom` through `scene` steps, so switching the flag to `true`
lights the room up behind the phone with no change to the script.

## Figma assets: export at 3x via download_figma_images

`get_screenshot` renders at the node's **natural size** and ignores
`maxDimension` above it — it cannot produce a higher-resolution export.
`mcp__figma-developer-mcp__download_figma_images` with `pngScale: 3` can, and
writes into the repo. Committed assets live in `public/allhands/`.

Icons come from Figma exports, never hand-drawn SVG — a hand-drawn mic and
technician both turned out to be visibly the wrong glyph.

## Dev-only tooling

- `window.__lumi` — the Zustand store, exposed in development only
  (`lib/store.ts`). Drive the demo from the console: `__lumi.getState().setBeatIndex(n)`.
- **Agentation** (`components/dev/Annotations.tsx`, mounted in `app/layout.tsx`) —
  click an element in the running app and leave a note that reaches the agent with
  the selector attached. Guarded on `NODE_ENV` so it can never appear over the
  Vercel demo. Needs `npx agentation-mcp server` (HTTP :4747) alongside `npm run dev`;
  `npx agentation-mcp doctor` checks both ends. In the toolbar, **Send Annotations**
  posts to the agent — **Copy** only fills the clipboard.
