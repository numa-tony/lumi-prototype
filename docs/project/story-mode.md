# Story Mode

Presenter-driven, scripted walkthroughs that drive the real app. One key press
per beat: the app responds as though someone were using it, but nothing is live —
no AI, no TTS, no mic, no network. That is deliberate: a demo in front of the
company cannot depend on a rate limit or the venue's wifi.

*Supersedes the earlier `story-mode-plan.md` (pre-build design) and
`story-mode-review.md` (Jun-11 code review). Open findings from that review are
carried at the bottom of this file.*

## The two stories

| Story | Entry | State |
|---|---|---|
| **Sarah's Day** | sidebar, or `?story` | The original arc: arrival → room → towels → AC → inbox → ramen → checkout → voice climax. **Frozen** |
| **All-Hands** | sidebar, or `?story=allhands` | "It started with an air conditioner." 29 taps. Tap-by-tap in `all-hands-story.md` |

**Frozen** means the `STORY` array in `lib/demo/story.ts` is what the presenter
rehearsed. Shared *visual* upgrades are expected to flow into it; its **beats**
do not change. Prove a change didn't touch them:

```bash
git show HEAD:lib/demo/story.ts | sed -n '/^export const STORY/,$p' > /tmp/a
sed -n '/^export const STORY/,$p' lib/demo/story.ts > /tmp/b && diff /tmp/a /tmp/b
```

## Driving it

`→` / `Space` advance · `←` back · `Esc` exit. Pressing `→` mid-beat
fast-forwards the rest of that beat, then advances. Going back **snaps**: the
runner resets the world and replays every step from 0 instantly.

## How it fits together

```
lib/demo/
  types.ts        Step union · PressBeat · Story        ← the vocabulary
  stories.ts      STORIES registry, getStory, beatsForStory
  story.ts        Sarah's Day beats (FROZEN) + its segments
  allHands.ts     All-Hands beats + ALLHANDS_STAY
  storyRunner.ts  applyStep · playBeat · snapToBeat · fastForwardCurrent
  request.ts      RequestState + the live countdown
  stay.ts         useStay() — per-story stay for the app screens
  scenes.ts       useStoryScenes() — whether the world scenes render

components/demo/
  StoryDirector.tsx  keyboard + playback; mounts the stage
  StoryStage.tsx     stage chrome — "full" (Sarah's Day) or "bare" (All-Hands)
  StoryDeepLink.tsx  ?story / ?story=<id>
  StoryPhoneShift.tsx  shifts the phone aside for a title card
  surfaces/          WhatsApp · iOS home · iOS lock · Dynamic Island · Live Activity
```

The store holds a `demo` slice (`lib/store.ts`): `storyId`, `beatIndex`,
`surface`, `islandExpanded`, `storyChat`, `waChat`, `storyVoice`, `request`,
`starters`, `stayVisible`, `roomBreakout`, `frontDoor`, `fade`.

### A beat

```ts
{
  id: "lights-on",
  segmentIndex: 3,
  background: "#000000",
  steps: [
    { kind: "tapReply", text: "Can you turn on the lights?" },
    { kind: "lumiTyping", ms: 900 },
    { kind: "scene", patch: { lights: { on: true, brightness: 75, warmth: "warm" } } },
    { kind: "lumiMsg", text: "Done — lights are on 💡" },
  ],
}
```

One `→` runs the whole `steps` array in order, 160ms apart. Convention: the
first step is Sarah's action, the rest are the world reacting.

### Adding to the engine

A new capability = a `Step` kind in `types.ts` + a case in
`storyRunner.applyStep`. The switch ends in a `never` guard, so a missing case
is a compile error rather than a step that silently does nothing on stage.

A new story = a beats file + a `STORIES` entry. Nothing else needs to know.

## Things that are the way they are for a reason

See `decisions.md` for the full set. The ones that bite most often:

- **Story surfaces use CSS, not Framer Motion.** Framer's springs are rAF-driven
  and rAF stops in a background tab. A surface that fails to appear because the
  presenter alt-tabbed is a broken demo.
- **Playback position is owned by the runner** (`activeBeatIndex`,
  `currentStepIndex`), not by the keydown closure. A closure can hold a stale
  beat index under rapid input.
- **A cancelled typewriter must not push its message.** Whoever cancelled —
  fast-forward, or a backward snap — owns what happens next.
- **`snapToBeat` cancels the running beat first**, or the old beat's remaining
  steps land on top of the snap.
- Geometry is **proportional to the Figma artboard** (402×874) because the
  phone's screen is 368×822.

## Verifying a change

Walk the story rather than trusting a screenshot — and remember the preview pane
often runs hidden, where animations and timers freeze (see AGENTS.md
*Working notes*). The fastest reliable loop:

```js
__lumi.getState().startStory('allhands');
__lumi.getState().setBeatIndex(28);   // jump past
__lumi.getState().setBeatIndex(n);    // step back → snaps instantly to beat n
```

Then read `getBoundingClientRect()` / `getComputedStyle()` for spacing and
colour claims. For rapid-input bugs, the throttled timers in a hidden pane are
an advantage: the typewriter stays in flight for seconds, so pressing `→` twice
reproduces the race every time.

## Open review findings

From the Jun-11 multi-agent review. Security pass was clean. P1s **A** (dead
`roomBreakout`), **B** (Netflix casing), **C** (duplicate message on fast
forward), **D** (stale beat index) and **E** (exhaustiveness guard) are fixed,
as are **G** (snap didn't cancel playback) and **P**/**T**/**U**.

Still open, roughly by value:

| # | Finding |
|---|---------|
| M | Story mutates *persisted* free-form state (`inStay`, `smartRoom`, `threads`). `exitStory` resets the world now, but the reset is duplicated in `snapToBeat` — factor one `resetWorld()` |
| N | The per-character typewriter routes through Zustand, re-rendering the whole message list each keystroke (plus an unmemoised `pinnedStatus` scan). Visible stutter on long threads |
| K | `StoryThreadView` ≈ `ThreadView` — the fork should be at the data source, not the render. Live already has `output-error` handling the story path lacks |
| L | `storyChat`/`waChat` store actions and the two typewriters are near-verbatim duplicates. One `typeAndSend` helper + one widget→part builder |
| F | `as unknown as UIMessage["parts"][number]` double-cast in the store; `as any` on the read side. Narrow to one typed helper at the AI-SDK boundary |
| I | Esc/exit doesn't cancel in-flight timers → a write can land after teardown |
| J | StrictMode double-mount fires `playBeat(0)` twice. Idempotent today, latent |
| O | Paint cost at the Sarah's Day climax: 60 framer rain loops + `background` gradient cross-fades. Use transforms/opacity |
| S | Magic timing literals; both world scenes share `z-[6]` |
| X | `scene` steps never set `lastDevice`, so the one-shot device pulse never fires in Story Mode |
