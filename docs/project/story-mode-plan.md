# Story Mode — "A Day With Lumi"

> Plan for the guided demo experience. Status: design locked, not yet built.

## Context

The prototype needs a second mode for stakeholder road-shows. Free-form mode (today's app)
is for hands-on play. **Story mode** is a presenter-driven, growth.design-style guided
narrative: press → to advance, the live app responds, scenery and narration frame each beat.

The goal is emotional, not exhaustive. We are not touring features — we are directing a
feeling: *Numa anticipates you; your stay is handled.* The crescendo is the one thing no
competitor has: **Sarah talks to her room and it responds.**

Cross-channel WhatsApp↔app is kept but demoted to a single "memory" beat in Act 1 (per the
Jun-10 PM call, it is de-prioritized as architecture but still lands as an emotional moment).
The new star is voice + in-room control, saved for last.

### Locked decisions

1. **Scripted/deterministic** messages — no live AI in Story mode (no latency/rate-limit risk in front of execs). Seed pattern only.
2. **Finale breaks out of the phone** — `SmartRoomScene` scales up to fill the stage background as Sarah's voice controls the room.
3. **Illustrated Sarah avatar + speech bubbles** for her inner voice; clean caption boxes for narration.
4. **Interactive (presenter-driven) first** — a screen-recording of it doubles as the async/video version Pim wants.

## The narrative spine

Three acts, ~3 min, 8 beats. Order builds rather than lists.

| # | Scene | Stage | The beat |
|---|-------|-------|----------|
| 0 | Title | Phone w/ Numa logo · "A day with Lumi · ~3 min · press →" | Invitation |
| 1 | Arrival | Berlin street, dusk · WA phone · *"just arrived — how do I get in?"* → door code | No app, no front-desk line. She just texted. |
| 2 | The memory | App opens — the WhatsApp thread is already there, threaded | "It already remembers everything?" (cross-channel as *memory*) |
| 3 | Proactive towels | Nudge: *"2 guests but set for 1 — extra towels?"* → status widget | She didn't even have to ask. |
| 4 | The AC (friction→relief) | *"AC's blowing warm air."* → logged → live ETA → "Fixed ✓" | The problem that's an hour on hold anywhere else. Two taps here. |
| 5 | Local friend | *"good ramen near here?"* → map widget, walking times | Like a friend who lives here. |
| 6 | The gift | *"2 extra hours Sunday — late checkout €25?"* | Revenue, framed as care (the exec sees monetization). |
| 7 | **The magic** | Room at night · voice torus · *"close the blinds, dim the lights"* → room responds → *"put on Netflix"* | She never touched a switch. **Close: "Not a chatbot. Your stay, handled."** |

Beat 4 is the emotional turn (relief). Beat 7 is the crescendo + breakout visual.

## Architecture

The whole engine is thin because every lever already exists in the store. Story mode is a
**director** that fires existing actions on a timeline, wrapped in **stage chrome**.

### State — new `demo` slice in `lib/store.ts`

```ts
demo: {
  active: boolean,      // story mode on/off
  beatIndex: number,
  roomBreakout: boolean // finale: SmartRoomScene fills the stage
}
// actions: startStory(), exitStory(), nextBeat(), prevBeat(), goToBeat(n)
```

`exitStory()` resets app state back to free-form defaults.

### Script as data — new `lib/demo/story.ts`

Mirrors the existing `SARAH_DAY` pattern in `lib/mock/waScenario.ts`, generalized to a full
timeline. `STORY: Beat[]` where each beat is declarative:

```ts
type Beat = {
  id: string; act: 1 | 2 | 3;
  background: string;                 // image path or gradient key
  narration?: string;                 // yellow caption box
  sarah?: string;                     // speech bubble line
  emotion?: "neutral" | "delighted" | "annoyed" | "content";
  phones: "app" | "both";
  pointer?: { target: string; label?: string };
  actions: BeatAction[];              // run on beat enter
  advance: "manual" | { afterMs: number };
};
```

`BeatAction` is a small union that maps 1:1 to **existing** store calls — the engine just
dispatches them. No new app behavior, only orchestration:

```ts
type BeatAction =
  | { type: "go"; screen: ScreenId }            // go()
  | { type: "setInStay"; value: boolean }       // setInStay()
  | { type: "smartRoom"; patch: SmartRoomPatch }// setSmartRoom()
  | { type: "seedThread"; threadId; messages }  // saveThreadMessages() + seed→UIMessage
  | { type: "openChat" | "closeChat" }
  | { type: "openVoice" }                        // VoiceSheet
  | { type: "waInject"; ... }                    // reuse pushLumiOutbound/resolveWaThread/beginWaThread
  | { type: "breakoutRoom"; value: boolean }
  | { type: "wait"; ms: number };
```

`runBeatAction()` interprets these against the store. Determinism comes from the existing
`seedMessageToUIMessage` / `scenarioSeedToUIMessage` helpers — no live LLM call.

### Director — new `components/demo/StoryDirector.tsx`

- Mounted only when `demo.active` (toggled from `SettingsPanel.tsx`, next to the WA demo toggle).
- Global keydown: `→` / `Space` = next, `←` = prev, `Esc` = exit.
- On entering a beat, runs its `actions` against the store, then renders the stage.
- The **pointer-hand is decoration only**: animate the tap, *then* fire the action. Decoupling visual from mutation keeps it recording-reliable.

### Stage chrome — new `components/demo/`

| File | Role |
|------|------|
| `Stage.tsx` | Full-screen overlay. Background crossfade + centered phone (`PhoneFrame`/`AppShell`); second phone via existing `WaPhoneGate` when `phones: "both"`. |
| `ProgressRail.tsx` | Vertical green progress bar (left edge). |
| `NarrationBox.tsx` | Yellow narrator caption. |
| `SpeechBubble.tsx` | Sarah avatar + bubble, keyed to `emotion`. |
| `PointerHand.tsx` | Animated tap flourish (visual only). |
| `TitleCard.tsx` | Beat 0 intro + duration + advance hint. |

### Finale breakout

When `demo.roomBreakout` is set (beat 7), render a second instance of the existing
`SmartRoomScene` as a stage-background layer scaled to fill the screen, crossfading from the
phone-contained view. `SmartRoomScene` is already self-contained, so this is a positioning +
scale wrapper, not a rewrite. Voice is scripted: play a TTS/recorded line, then fire
`setSmartRoom` directly — looks live, never fails.

## Reused, not rebuilt

- Dual-phone layout — `components/whatsapp/WaPhoneGate.tsx`
- WA injection actions — `pushLumiOutbound`, `resolveWaThread`, `beginWaThread` in `lib/store.ts`
- Seeded messages — `seedMessageToUIMessage`, `scenarioSeedToUIMessage`
- Widgets — `components/chat/widgets/*` (statusWidget, mapWidget, quickReply, reservationCard…)
- Room visuals — `components/device/SmartRoomScene.tsx` + `setSmartRoom`
- Voice UI — `components/voice/VoiceSheet.tsx`
- Screen routing — `go()` + `AppShell` `SCREENS` map

## Build order

1. **Engine skeleton** — `demo` store slice + `StoryDirector` + one trivial beat. Prove arrow-key advance drives the live app (e.g. a `go()` action switching screens).
2. **Stage chrome** — background crossfade, progress rail, narration box, speech bubble, pointer, title card.
3. **Author the 8 beats** — `lib/demo/story.ts` using existing seed/widget/room/WA actions.
4. **Finale breakout** — scaled `SmartRoomScene` + scripted voice line.
5. **Polish** — crossfade timing, avatar emotions, closing card. (Recording version falls out for free.)

## Verification

- Toggle **Story mode** in the Settings panel → title card appears, free-form app hidden.
- Press `→` through all 8 beats: screens switch, widgets render, WA phone slides in for beat 2, status/map widgets appear, room scene animates, finale breaks out of the phone.
- `←` steps back; `Esc` exits cleanly to free-form with state reset.
- Screen-record a full run → confirm it works as the async/video artifact.
