# Story Mode — Code Review Findings (commit `455940d`)

> Multi-agent review, 2026-06-11. Calibrated for a non-production presenter demo.
> Delete this file once findings are addressed. Security pass: **clean** (no findings).

## 🔴 P1 — Demo-breaking (verified against code)

### A. Climax room scene *vanishes* instead of going dark — `roomBreakout` is dead state
- `demo.roomBreakout` is written (`store.ts` `setRoomBreakout`, 4 `breakout` steps in `story.ts:91,182,482,528`) but **read nowhere** outside the store.
- `SmartRoomScene.tsx:65` gates visibility on `inStay && lights.on`, NOT `roomBreakout`.
- `climax-lights` (`story.ts:514`) sets `lights:{on:false}` → `sceneVisible` flips false → the whole room unmounts at the final "quiet earned ending" beat. The Step's own comment (`story.ts:24`) says `// SmartRoomScene visibility` — the wiring was intended but never done.
- **Fix:** `SmartRoomScene.tsx:65` → `const sceneVisible = roomBreakout || (inStay && lights.on);` (read `demo.roomBreakout`). Live mode unaffected (breakout stays false there).

### B. Netflix casing mismatch — climax renders a generic channel bar, not Netflix
- `story.ts:481` sets `app: "netflix"` (lowercase); `SmartRoomScene.tsx:500` checks `tv.app === "Netflix"`; fallback `:521` excludes only capitalized names → lowercase falls through to the generic branch.
- **Fix:** change script to `app: "Netflix"`. Consider tightening `tv.app` (`smartRoom.ts:9`) to a string-literal union so the next mismatch is a compile error.

### C. Duplicate messages when presenter mashes → (fast-forward double-push)
- `storyRunner.ts:42-48` — on cancel mid-typewriter the `catch` *falls through and pushes the full message* ("fall through to push" comment). Meanwhile `fastForwardCurrent` (`:228-237`) starts at `currentStepIndex` (the in-flight step) and pushes it instantly too → message appears twice, on both phones during towels/AC beats.
- **Fix:** on cancel, `return` instead of falling through to push; let fast-forward own the single instant push.

### D. Stale beat-index / `currentStepIndex` desync on rapid → skips world-setup steps
- Three sources of truth for "which beat/step": module-global `currentStepIndex`, the keydown closure's `beatIndex`, and `playingRef`. Under fast input they drift; `fastForwardCurrent(n)` can run against a beat the runner isn't actually playing, skipping `frontDoor`/`breakout`/`scene` setup → scene stuck in wrong state.
- **Fix:** let the runner own playback position — record `activeBeat` in `playBeat`, make `fastForwardCurrent()` take no arg and read `activeBeat`+`currentStepIndex` atomically.

### E. No exhaustiveness guard on the `Step` switch
- `storyRunner.ts` `applyStep` switch covers all 22 variants but has no `default: { const _: never = step; throw ... }`. A future Step variant silently no-ops with zero compile/runtime signal.
- **Fix:** add the `never` default arm.

## 🟡 P2 — Should fix

| # | Finding | Location |
|---|---------|----------|
| F | `as unknown as UIMessage["parts"][number]` double-cast, duplicated in two store actions; read side uses `as any`. Narrow to one typed helper at the AI-SDK boundary. | `store.ts` `pushStoryLumiMsg`/`pushStoryWaLumiMsg`; `StoryThreadView.tsx:48-52` |
| G | `snapToBeat` (backward nav) does NOT cancel the active forward `playBeat` → they run concurrently and fight over the store. | `storyRunner.ts:165`; `StoryDirector.tsx:31-35` |
| H | `snapToBeat` is `async` + fire-and-forget; ← spam stacks overlapping resets/replays. Make instant replay synchronous. | `storyRunner.ts:165-186` |
| I | Esc/exit/✕/Back-to-main don't cancel in-flight timers → state writes land after teardown → ghost bubble next run. | `exitStory` (`store.ts`); `StoryDirector.tsx` |
| J | StrictMode double-mount + redundant kickoff effect → `playBeat(0)` fires twice. Idempotent today (beat 0 only), latent footgun. Collapse the two effects; guard with a ref. | `StoryDirector.tsx:24-41,69-74` |
| K | Duplicated render path: `StoryThreadView`≈`ThreadView`, `WaStoryView`≈`WaConversation` (planned `MessageList` extraction never happened). `Row`/`TextBubble`/parts-loop copy-pasted → will drift (live already has `output-error` handling story path lacks). | `StoryThreadView.tsx`, `WaStoryView.tsx` |
| L | storyChat/storyWa store actions (~90 lines) and userMsg/waUserMsg typewriter (~18 lines) are near-verbatim duplicates. Extract one `typeAndSend` helper + one widget→part builder. | `store.ts:215-320`; `storyRunner.ts:31-49,74-92` |
| M | Story mutates *persisted* free-form state (`inStay`, `smartRoom`, `threads` via shared actions); `exitStory` resets only the `demo` slice, not the world. Presenter exits into Sarah's leftover state. Factor a `resetWorld()` used by both `snapToBeat` and `exitStory`. | `store.ts` `exitStory:193`; `storyRunner.ts:165-178` |
| N | Per-character typewriter routes through Zustand → re-renders whole message list each keystroke (O(messages×parts) `pinnedStatus` scan, unmemoized). Visible stutter on long late-story threads. Split composer to subscribe only to `draft`; memoize the list + `pinnedStatus`. | `storyRunner.ts:36-41`; `StoryThreadView.tsx:34-53` |
| O | 60 infinite framer-motion rain loops (main-thread RAF) + `SmartRoomScene` cross-fades by animating `background` gradient (non-compositable repaint, 26vw×64vh, 1.2s) + full-screen `mixBlendMode:screen` overlay animating `background`. Paint storm at climax. Use CSS keyframe transform for rain (or ~25 drops + `will-change`); cross-fade sky via stacked layers + `opacity`. | `FrontDoorScene.tsx:363-399`; `SmartRoomScene.tsx:245-253,637-645` |
| P | Beat→segment counter math leaks story structure into chrome (`SEGMENTS.length - 2` magic). Derive from data. | `StoryStage.tsx:28-30` |

## 🔵 P3 — Nice-to-have / cleanup

- **Q** Raw `#ff671f` literals where `numa` token exists → use `text-numa`/`bg-numa`/`var(--color-numa)`. (`StoryStage.tsx`, `SidePanel.tsx`, `SettingsPanel.tsx`)
- **R** `font-bold`/`font-medium` violate the TWK Lausanne 300/600-only rule → `font-semibold`/`font-light`. (`StoryStage.tsx`, `StoryPhoneLabel.tsx`)
- **S** Magic timing literals (`42`/`800`/`180` twice); both scenes share `z-[6]` (implicit stacking) → named consts + z-scale.
- **T** `storyBeatNum = Math.max(0, currentSegment - 0)` → `= currentSegment`. (`StoryStage.tsx:29`)
- **U** Progress-rail ternary has two identical arms → `i <= currentSegment ? ...`. (`StoryStage.tsx`)
- **V** Duplicate `// Press 13` comment; subsequent press numbers off-by-one. (`story.ts:303,315`)
- **W** Dead `lastDirection` ref (written, never read). (`StoryDirector.tsx:17,29`)
- **X** `scene` steps never set `lastDevice` → the one-shot device-pulse animation never fires in Story Mode. (`storyRunner.ts:108`)
- **Y** Stale planning docs `story-mode.md` (335) + `story-mode-plan.md` (148) describe a pre-implementation design that diverged from shipped code → delete or reconcile.
- **Z** `WaPhone` takes `demoActive` prop-drilled while every sibling reads `useApp` directly. (`WaPhone.tsx`)

## Root cause clustering
- **C, D, G, H, I, J** all stem from one thing: playback position + cancellation spread across three owners. Consolidating ownership into the runner (one token, one beat pointer) collapses the whole class.
- **A, B** are independent one-line script/gate bugs but both hit the *climax* — fix before the next exec showing.
- **K, L, N** are the duplication/perf cost of the (correct) decision to fork the chat render path; the fork should be at the data source, not the rendering.
