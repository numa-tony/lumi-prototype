# All-Hands walkthrough — "It started with an air conditioner."

The second scripted story on the Story Mode engine, built from *Lumi All-Hands —
Script & Run-of-Show (Draft 2)* and the Figma frames on the **🎙️ T2 2026 All
Hands Prep** page of the Lumi Vision file.

**Run it:** sidebar → **All-Hands**, or `http://localhost:3000/?story=allhands`.
(Bare `?story` still opens Sarah's Day.)

**Drive it:** `→` or `Space` advances · `←` goes back (snaps instantly) ·
`Esc` exits. Pressing `→` while a beat is still playing fast-forwards it.

Nothing here touches the network: no live AI, no TTS, no mic. The stage is black
throughout — background scenes are a later round (see *Adding backgrounds*).

## The stay

Numa Berlin Friedrichshain · room 204 · Thu 9 – Sun 12 July 2026. Friday is the
second night — the night of the AC. The phone clock is fixed at 9:41, and the
ticket times hang off it (received 9:41 PM, ETA 10:11 PM) so nothing on screen
contradicts anything else.

## The taps

| Tap | Beat | On the phone |
|----:|------|--------------|
| 0 | — | Title card; phone shows the empty WhatsApp thread with **Numa ✓ · online** |
| 1 | 01 | Sarah types the AC message on WhatsApp (9:39 PM) |
| 2 | 01 | The bot apologises, opens a request, passes it on (9:40 PM) — then nothing. **The silence is the beat.** |
| 3 | 02 | One extra line: *follow this live in the Numa app* + `numa.app/r/204-ac` |
| 4 | 02 | App-switch → the Numa app opens on the chat with the **pinned status card**. Countdown starts |
| 5 | 02 | *"Do I need to be in the room for this?"* — card stays pinned while she asks |
| 6 | 02 | **Inbox** — one thread, because she's only asked us one thing |
| 7 | 02 | **iOS home screen**, compact Dynamic Island: *Numa · 30m* |
| 8 | 02 | Island **expands**: technician, countdown, progress |
| 9 | 02 | **Lock screen** (Friday, 10 July) — same status, same countdown |
| 10 | 03 | Tap the widget → straight back into the chat |
| 11 | 03 | Back to the Inbox |
| 12 | 03 | → **Explore** (she notices the FAB: Ask Lumi · Open door) |
| 13 | 03 | → **My Trips** |
| 14 | 03 | → **Trip Detail** — Berlin Friedrichshain, room 204, code 2930 |
| 15 | 03 | → **Your room** |
| 16 | 03 | Ask Lumi opens with starters: WiFi · coffee machine · *Can you turn on the lights?* |
| 17 | 03 | She **taps** the third one → lights on |
| 18 | 03 | Types *turn off the lights* → lights off |
| 19 | 03 | Fade → **Sat 11 Jul · 8:14 AM** divider → *open the blinds* |
| 20 | 04 | Fade → Explore → Ask Lumi (lunch starters) |
| 21 | 04 | *anywhere nice to eat near here?* → **a better question** + chips |
| 22 | 04 | Taps **Ramen** → **map** with Cocolo Ramen and Takumi Nine |
| 23 | 04 | Fade → Explore → Ask Lumi (Sunday morning) |
| 24 | 04 | *What time is my checkout?* → reservation card + **extend to 1pm for €20** |
| 25 | 04 | Taps **Yes, book it for €20** → done |
| 26 | 05 | Fade → Explore with **no trip card** — the stay is over, nothing booked |
| 27 | 05 | *which Numa should I stay at in London?* → **What's the vibe?** + chips |
| 28 | 05 | Taps **Quiet, near a park** → three London properties |
| 29 | — | End card → Replay / Back to main |

Lumi and Sarah's lines are in `lib/demo/allHands.ts` — one `PressBeat` per tap,
in the same order as the table.

## How it's put together

| Piece | Where |
|---|---|
| Story registry (both stories) | `lib/demo/stories.ts` |
| Engine types — the `Step` vocabulary | `lib/demo/types.ts` |
| This script | `lib/demo/allHands.ts` |
| Sarah's Day (frozen) | `lib/demo/story.ts` |
| Step runner, snap/play/fast-forward | `lib/demo/storyRunner.ts` |
| Live request + countdown | `lib/demo/request.ts` |
| Pinned card · Dynamic Island · lock activity | `components/demo/surfaces/RequestActivity.tsx` |
| WhatsApp / home / lock surfaces | `components/demo/surfaces/` |
| Per-story stay shown by the app screens | `lib/demo/stay.ts` |
| Your room screen | `components/screens/YourRoomScreen.tsx` |

The store holds `demo.storyId`; everything else keys off it.

### Adding backgrounds later

The stage is black because `STORIES.allhands.scenes` is `false` — that single
flag gates `SmartRoomScene` and `FrontDoorScene` (via `useStoryScenes()`).
The beats already drive the room through `scene` steps exactly as Sarah's Day
does: lights on at tap 17, off at 18, blinds open at 19, morning sky at 19. So
switching `scenes` to `true` lights the room up behind the phone with no changes
to the script.

### Presenting

Run it from localhost — nothing can be taken down by Wi-Fi or a rate limit.
`https://numa-lumi-prototype.vercel.app/?story=allhands` is the fallback and the
link to share afterwards.

One caveat worth knowing: browsers pause animations in a background tab, so keep
the demo tab in front while presenting.
