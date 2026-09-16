# All-Hands walkthrough — "It started with an air conditioner."

The second scripted story on the Story Mode engine, built from *Lumi All-Hands —
Script & Run-of-Show (Draft 2)* and the Figma frames on the **🎙️ T2 2026 All
Hands Prep** page of the Lumi Vision file.

**Run it:** sidebar → **All-Hands**, or `http://localhost:3000/?story=allhands`.
(Bare `?story` still opens Sarah's Day.)

**Drive it:** `→` or `Space` advances · `←` goes back (snaps instantly) ·
`Esc` exits. Pressing `→` while a beat is still playing fast-forwards it.

Nothing here touches the network: no live AI, no TTS, no mic. It plays in front
of five photographs of the Berlin room and the train home — see *The stage*.

## The stay

Numa Berlin Friedrichshain · room 204 · Thu 9 – Sun 12 July 2026. Friday is the
second night — the night of the AC. The phone clock is fixed at 9:41, and the
ticket times hang off it (received 9:41 PM, ETA 10:11 PM) so nothing on screen
contradicts anything else.

## The taps

32 taps. **◆ = the room owns the stage** — the phone is below the frame, and a
time-and-place line sits bottom-left. Talk over those for as long as you like;
the next press brings the phone back up.

| Tap | Beat | On stage |
|----:|------|----------|
| 0 ◆ | — | Opens on the room, not the phone: **Friday, 9:39 PM** — the room as photographed, the thermostat reading 26 °C |
| 1 | 01 | The phone **rises** onto the room: empty WhatsApp thread with **Numa ✓ · online**. Behind it, the room dims to the story's lights-off |
| 2 | 01 | Sarah types the AC message (9:39 PM) |
| 3 | 01→02 | The bot apologises, opens a request, passes it on (9:40 PM). **Then, three seconds later and with no press from you**, the extra line lands: *follow this live in the Numa app* + `numa.app/r/204-ac`. The pause in between is the beat |
| 4 | 02 | She taps the link → straight onto the chat with the **pinned status card**. Countdown starts |
| 5 | 02 | *"Do I need to be in the room for this?"* — card stays pinned while she asks |
| 6 | 02 | Straight from the chat to the **iOS home screen**, compact Dynamic Island: *Numa · 30m* |
| 7 | 02 | Island **expands**: technician, countdown, progress |
| 8 | 02 | **Lock screen** (Friday, 10 July) — same status, same countdown |
| 9 | 03 | Tap the widget → straight back into the chat |
| 10 | 03 | → **Inbox**. One thread, because she's only asked us one thing |
| 11 | 03 | → **Explore** (she notices the FAB: Ask Lumi · Open door) |
| 12 | 03 | → **My Trips** |
| 13 | 03 | → **Trip Detail** — Berlin Friedrichshain, room 204, code 2930 |
| 14 | 03 | → **Your room** |
| 15 | 03 | Ask Lumi opens with starters. The AC is fixed: **a breath of cool air** crosses the room behind the phone |
| 16 | 03 | She **taps** *Can you turn on the lights?* → **the lights come on**: the room behind the phone brightens, and stays bright |
| 17 | 03 | *turn off the lights* → **the room dims** again |
| 18 ◆ | 03 | The phone leaves; the room dips to black and rises on **Saturday, 8:14 AM** — curtains drawn, light leaking at the seam |
| 19 | 03 | Phone up → *open the blinds* → **the open room spreads outward from the seam** |
| 20 | 04 | Explore → Ask Lumi (lunch starters); the room dips and rises behind the phone — later the same day |
| 21 | 04 | *anywhere nice to eat near here?* → **a better question** + chips |
| 22 | 04 | Taps **Ramen** → **map** with Cocolo Ramen and Takumi Nine |
| 23 ◆ | 04 | Sunrise dissolves in as the phone leaves: **Sunday, 9:20 AM** |
| 24 | 04 | Phone up → Ask Lumi (checkout starters) |
| 25 | 04 | *What time is my checkout?* → reservation card + **extend to 1pm for €20** |
| 26 | 04 | Taps **Yes, book it for €20** → done |
| 27 ◆ | 05 | The room drifts away and the train window arrives as the phone leaves: **Sunday, 3:10 PM · Leaving Berlin** |
| 28 | 05 | Phone up → Explore with **no trip card** — the stay is over, nothing booked → Ask Lumi |
| 29 | 05 | *which Numa should I stay at in London?* → **What's the vibe?** + chips |
| 30 | 05 | Taps **Quiet, near a park** → three London properties |
| 31 | — | The phone leaves; the end card lands over the darkened train window → Replay / Back to main |

Lumi and Sarah's lines, and the stamps, are in `lib/demo/allHands.ts` — one
`PressBeat` per tap, in the same order as the table.

**Lumi is the knot.** Every Ask Lumi start screen (taps 15, 20, 24, 28) shows the
live holographic knot from `numa-lumi-branding` v7, idling. On a first question
(taps 16, 21, 25, 29) it glides down under her message and spins while Lumi
thinks, then fades as the answer lands in its place. On a follow-up (tap 17, and
the others) it reappears there, already thinking. There are no typing dots.

## The stage

Five photographs, `~/Downloads/Proto BG Photos/` at source, each at 2880×2048:

| id | file prefix | where it plays |
|---|---|---|
| `ac` | `1-` | taps 0–17, Friday night |
| `blinds-closed` | `2-` | tap 18, Saturday before the blinds |
| `blinds-open` | `3-` | taps 19–22 |
| `sunday` | `4-` | taps 23–26 |
| `train` | `5-` | taps 27–31 |

**Changing a photo:** drop the new one in the folder with the slot's number
prefix (e.g. `3-…` for Saturday with the blinds open) and run
`npm run stage:photos`. A file without a number prefix is ignored — the script
now says so — and anything starting with `_` is parked out of the way (the
previous Saturday photo is kept as `_prev-3-…`). It writes AVIF under `public/allhands/stage/`
and regenerates `lib/demo/stagePhotos.ts` — including each photo's scrim, rim
colour and anchors, so nothing needs retuning by hand.

**Friday's lights:** the Friday photo has its lamps lit, but the story starts
with them off, so the dark is an overlay shaped to the room — deeper over the
lamps and their pools. The opening frame is left as photographed; the overlay
comes in behind the phone from the first press, and it's what the lights-on and
lights-off beats lift and lower. Behind the phone, the dark room sits a touch
darker than the lit ones — night, but still readable. A real lights-off render is better: save it as
`1b-…` (same room and framing, lamps off, the 26 °C still glowing) and re-run
`npm run stage:photos`. The lights switch then crossfades between the two
photographs, with no code change.

How it works — focus modes, the moves, why CSS — is in `story-mode.md`
(*The photographic stage*).

## How it's put together

| Piece | Where |
|---|---|
| Story registry (both stories) | `lib/demo/stories.ts` |
| Engine types — the `Step` vocabulary | `lib/demo/types.ts` |
| This script | `lib/demo/allHands.ts` |
| Sarah's Day (frozen) | `lib/demo/story.ts` |
| Step runner, snap/play/fast-forward | `lib/demo/storyRunner.ts` |
| The photographic stage | `components/demo/stage/PhotoStage.tsx`, `.stage` block in `app/globals.css` |
| The phone leaving and rising | `components/demo/StoryPhoneShift.tsx` |
| Stage photos + their measurements | `scripts/stage-photos.mjs` → `lib/demo/stagePhotos.ts` |
| Live request + countdown | `lib/demo/request.ts` |
| Pinned card · Dynamic Island · lock activity | `components/demo/surfaces/RequestActivity.tsx` |
| WhatsApp / home / lock surfaces | `components/demo/surfaces/` |
| Per-story stay shown by the app screens | `lib/demo/stay.ts` |
| Your room screen | `components/screens/YourRoomScreen.tsx` |
| The Lumi knot in the chat | `components/lumi-knot/` (sync: `npm run sync:knot`), placed by `components/chat/useKnotPlacement.ts` |

The store holds `demo.storyId`; everything else keys off it. Each story declares
the surface it opens on (`initialSurface`), applied the moment it starts.

### iOS surfaces

The home screen and lock wallpaper are the real frames exported from the Figma
prep page (`public/allhands/ios-home.png`, `ios-lock-wallpaper.png`), with the
stock "My App" slot painted out so the Numa tile can take it. The Dynamic Island
and both Live Activities are drawn over the top from the same `RequestState`,
using the technician asset exported from the Figma widget
(`public/allhands/technician.png`). Island and widget geometry is expressed as
proportions of the Figma artboard, so they track the phone at any size.

### Presenting

Run it from localhost — nothing can be taken down by Wi-Fi or a rate limit.
`https://numa-lumi-prototype.vercel.app/?story=allhands` is the fallback and the
link to share afterwards.

**Keep the demo tab in front.** Browsers stop animating background tabs, and
the stage is all motion. The same goes for the in-app preview pane, which runs
hidden — to check the stage without a visible browser, use
`node scripts/shoot-story.mjs` (see `story-mode.md`).
