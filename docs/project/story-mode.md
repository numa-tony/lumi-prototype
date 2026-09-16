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
| **All-Hands** | sidebar, or `?story=allhands` | "It started with an air conditioner." 32 taps, in front of a photographic stage. Tap-by-tap in `all-hands-story.md` |

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
  stagePhotos.ts  GENERATED — the stage photos and their measurements

components/demo/
  StoryDirector.tsx  keyboard + playback; mounts the stage
  StoryStage.tsx     stage chrome — "full" (Sarah's Day) or "bare" (All-Hands)
  StoryDeepLink.tsx  ?story / ?story=<id>
  StoryPhoneShift.tsx  moves the phone: aside for a title card, off-stage for a scene
  stage/PhotoStage.tsx the photographic stage (stories with `stage: "photos"`)
  surfaces/          WhatsApp · iOS home · iOS lock · Dynamic Island · Live Activity
```

The store holds a `demo` slice (`lib/store.ts`): `storyId`, `beatIndex`,
`surface`, `islandExpanded`, `storyChat`, `waChat`, `storyVoice`, `request`,
`starters`, `stayVisible`, `roomBreakout`, `frontDoor`, `fade`, `stage`.

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

## The photographic stage

Stories with `stage: "photos"` (All-Hands) play in front of photographs instead
of the illustrated room. Two axes, set independently:

- **Which photo** — `backdrop` steps. `via` is how it arrives: `cut`,
  `dissolve` (crossfade + slow scale settle), `night` (dip to black, swap in the
  dark, rise), `part` (opens outward from the curtain seam), `travel` (the old
  place drifts away as the new one arrives).
- **Who owns the stage** — `focus` steps. `scene`: the photo, sharp and slowly
  drifting, with a time-and-place stamp; the phone is below the frame. `phone`:
  the phone, with the photo sunk behind a scrim, blurred and scaled up 4 %.

Plus two moments: `glance` lifts the scrim while the room itself changes (the
blinds opening), and `pulse` fires a one-shot accent across the room (the cool breath when the AC is fixed).

```ts
{ kind: "focus", mode: "scene" },                             // phone leaves
{ kind: "backdrop", photo: "blinds-closed", via: "night" },   // a night goes by
{ kind: "focus", mode: "scene", stamp: { when: "Saturday, 8:14 AM", where: "Berlin" } },
// …next beat:
{ kind: "focus", mode: "phone" },                             // phone rises on top
```

How the runner treats them — each follows a rule that already exists elsewhere
in the engine:

- **`focus` waits for the move to land** (rise 950ms, sink 650ms), so typing
  never starts under a phone that is still moving.
- **`glance` returns on a timer rather than being awaited**, so the room change
  after it plays *inside* the glance.
- **A cancelled `night` writes nothing more** — the canceller lands the photo,
  the same rule as a cancelled typewriter. Otherwise a stale dip-release could
  end the next beat's dip.
- **`pulse` only fires when animated**; a snap or fast-forward never replays it.
- **`snapToBeat` sets `stage.instant`** for the replay: the end state renders with
  every transition off, and anything that *mounts* during a snap captures that
  and never plays its entrance later. So `←` really is instant.

All of the motion is CSS (the `.stage` block in `app/globals.css`), and it uses
transitions, not keyframes, for anything that can be interrupted. A press
mid-rise retargets a transition from wherever it is, whereas a keyframe would
jump. Keyframes are only for one-shot entrances. The durations are named there
(`--stage-ease-*`) and mirrored by the runner's constants.

**The scrim is solved per photo.** The five photos span a 4× range of brightness,
so `scripts/stage-photos.mjs` measures each one and solves the scrim alpha that
lands it on one target luminance, tinted with that photo's shadow colour. It
also measures the anchors the accents use (the thermostat, the curtain seam, the
lamps). Re-run it after changing a photo; nothing is tuned by hand.

Photos are two slots, not all mounted: the entering photo is keyed by the
backdrop's `seq`, so its entrance always plays from the start; the outgoing one
keeps its DOM node underneath, so it never re-decodes.

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
- **The chat's typing dots are the Lumi knot.** `StoryThreadView` derives a knot
  mode (`start` / `loading` / `hidden`) from `lumiTyping` and the last message.
  `useKnotPlacement` moves one knot between empty anchors, so it follows v7's
  glide-then-fade. The knot itself is vendored (`npm run sync:knot`), so never
  edit `components/lumi-knot/vendor/`.

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
colour claims.

**The photographic stage can't be judged in the preview pane at all** — its
transitions freeze there. `node scripts/shoot-story.mjs` plays All-Hands
headless at real timing and *asserts* what it can: the phone off-screen in
scene focus and centred in phone focus, the same darkness behind the phone in
every room, every photo decoded, `←` snapping with no transition running, and
no jump when `→` lands mid-move. It also checks the Lumi knot, which the preview
pane never draws (WebGL needs rAF):

- It sits on its anchor, and it's really drawn.
- It glides from a start screen and appears in place otherwise.
- It's gone once Lumi answers.
- There's only ever one knot canvas, and no WebGL context warnings.

It writes a frame per beat, a contact sheet and
a strip through each scene change to `.scratch/story/`. `--story sarah` checks
that Sarah's Day is untouched; `--reduced` runs it with reduced motion. For rapid-input bugs, the throttled timers in a hidden pane are
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
| S | Magic timing literals; both world scenes share `z-[6]`. *The photographic stage names its timings (`--stage-*`, mirrored in the runner); the world scenes still don't* |
| X | `scene` steps never set `lastDevice`, so the one-shot device pulse never fires in Story Mode |
