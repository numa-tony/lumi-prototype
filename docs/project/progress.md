# Progress — Updated 2026-09-14

> **2026-09-14 — Lumi is the knot.** Still on `feat/allhands-stage`, and nothing
> is committed yet. The story chat's static torus is now the live holographic
> knot from `numa-lumi-branding` v7. It works in both stories:
> - On the start screen it idles.
> - On a first question it glides down under her message and spins while Lumi
>   thinks, then fades as the answer lands in its place.
> - On a follow-up it reappears there, already thinking.
> - The typing dots are gone.
>
> The knot is vendored by `npm run sync:knot`, pinned to upstream `0c2ea6e`.
> Upstream isn't edited: four codemods add the `dispose()` that it lacks. The why
> is in `decisions.md` (*The Lumi knot in the story chat*).
>
> Verified headless with `scripts/shoot-story.mjs`, which now asserts the knot:
> - Every All-Hands start screen had the knot on its anchor (0px off) and really
>   drawn (pixel stdev ~79).
> - All 10 thinking beats: it glided exactly when coming from a start screen and
>   appeared in place otherwise, and was 36px and 0px off once still.
> - `←` snaps landed on the anchor with nothing moving.
> - There was never more than one knot canvas.
> - With reduced motion, all 10 thinking beats appear in place with no glide.
> - Sarah's Day is clean. Types and lint are clean.
>
> **The preview pane never draws the knot** (WebGL needs rAF), so use the script.
> Smoothness still needs the presenter's machine.

> **2026-09-10 — All-Hands gets its stage.** Branch `feat/allhands-stage` (cut
> from `feat/lumi-cube-chat`; nothing committed). The walkthrough now plays in
> front of five photographs — Friday night in the Berlin room, Saturday with the
> blinds closed then open, Sunday sunrise, the train home — instead of black.
> When a new place or time arrives the phone leaves the frame and the room owns
> the stage, stamped with the time; the next press brings the phone back up on
> top with the room dimmed and blurred behind it. Turning Friday's lights on
> brightens the room behind the phone until she turns them off; the blinds
> opening lifts the scrim so it's seen. 29 → 32 taps (four scene introductions added; the inbox stop between the chat and the home screen dropped). Tap list in
> `all-hands-story.md`; engine in `story-mode.md`; the why in `decisions.md`.
>
> Verified headless with `scripts/shoot-story.mjs`, which asserts rather than
> eyeballs: phone off-screen in every scene beat and centred (±2px) in every
> phone beat; the same darkness behind the phone in every room (luma 21.7–23.1,
> target 22); page never scrolls; `←` snaps with nothing in motion onto the
> forward-played state; `→` mid-sink retargets the phone (0px jump); reduced
> motion green; Sarah's Day untouched. Build, types and lint clean.
>
> Three things to know before picking this up:
>
> 1. **`app/globals.css` edits don't hot-reload.** Turbopack keeps the CSS it
>    compiled at startup, even across restarts. No error — the rule just isn't
>    there. Stop the server, `rm -rf .next/dev`, restart. (AGENTS.md has the check.)
> 2. **The headless rig proves correctness, not smoothness.** It renders with
>    software WebGL at a few frames a second, so it can't judge whether the blur
>    and scale feel smooth. That needs the presenter's machine, in a foreground
>    browser.
> 3. **Friday's lights-off is a shaped overlay** over a lamps-lit photo. A real
>    lights-off render saved as `1b-…` in the photo folder, then
>    `npm run stage:photos`, swaps it for a true crossfade with no code change.

> **2026-09-09 (evening) — The Lumi cube lands, and a lab to shape it in.**
> Branch `feat/lumi-cube-chat`, kept off `main` so the Vercel demo stays
> presentable. The chat's start screen moves to Figma **7274-12724**: the glass
> cube on its own lit field, "Hi Sarah / What can I help you with?", starters
> low and left, the Ask Lumi pill.
>
> **The cube is not an asset — it's a renderer.** ~2,900 lines of
> react-three-fiber and GLSL vendored from `numa-lumi-branding-v2` by
> `npm run sync:lumi3d`, which never hand-edits and records the upstream commit,
> so further exploration upstream is one command to pull in. Full reasoning in
> `decisions.md`; how to use it in `docs/project/chat-lab.md`.
>
> **`/lab`** is the bench — the real chat components at device size, with state
> and composition knobs and a URL you can point at an exact pose. The cube's
> idle pose is measured against the frame (within 0.3% on width, top and
> bottom), not eyeballed.
>
> Three things to know before picking this up:
>
> 1. **The preview pane cannot render `/lab` at all.** rAF is stopped there, and
>    r3f needs a frame even to size its canvas — you get a flat `#f7f3f0`
>    rectangle that looks exactly like a bug. Use `node scripts/shoot-lab.mjs`,
>    which runs headless Chromium with real WebGL and asserts the draw-call
>    count.
> 2. **The white wash currently takes the cube with it.** Background and cube
>    are one canvas, so fading to white for the thread state fades the docked
>    cube too. Undecided: keep the thread on the cube's `#f7f3f0` canvas colour
>    (cheapest, but WebGL keeps running), bake a transparent docked mark and
>    unmount the canvas, or drop the cube from the thread entirely.
> 3. **Two frames disagree about the composer gutter.** 7274-12724 (start
>    screen) says 12px sides / 32px foot; 7229-13293 (conversation) says 24/24,
>    which is what shipped. `AskLumiInput` takes both as props and defaults to
>    the start screen's. Worth a ruling.
>
> Nothing in the live app changed yet — `ThreadView` and `StoryThreadView` still
> render their own start screens. The new shared chrome
> (`components/chat/lumi/`) is what they'll move onto.

> **2026-09-09 (afternoon) — Figma fidelity pass, driven by Agentation notes.**
> A run of screen-by-screen feedback on the running app, each item measured
> against its frame rather than eyeballed. The whole session is written up in
> `decisions.md`; the short version:
>
> - **The type was wrong everywhere.** `TWKLausanne-600.woff2` was really TWK
>   Lausanne **700 Bold** and the 300 was really **350**, so every heading and
>   label rendered a full step heavier than the frames. Replaced with the design
>   system's own cuts. Also snapped the stragglers — `font-medium` was silently
>   resolving down to 300 and `font-bold` down to 600 — so only `font-light` and
>   `font-semibold` remain, with `font-synthesis: none` as a guard.
> - **Trip Detail** (7256-13081) and **Your room** (7256-4436) rebuilt as literal
>   ports, verified by measuring the running screens against the frames' own
>   coordinates. Assets exported and committed under `public/trip/` and
>   `public/room/`; the DS list row is now shared as `ListItem`/`ListDivider`.
> - **The trip card badge** (7256-11647) is the DS neutral Badge with its
>   trailing arrow, and the duplicate underlined CTA below it is gone.
> - **Story chat spacing** (7229-13293) — 24px gutters, 52px under the grabber,
>   32px after her turn, 24px elsewhere. Composer sits 24px off the screen foot.
> - **Scripted taps are visible now** — `tapReply` holds the chip pressed for
>   380ms before the reply lands, so the audience sees the choice being made.
> - **The ramen map's dotted walk connects its pins** at any width.
>
> Two things to know before picking this up:
>
> 1. **`roomControls` has no tap-through entry point.** Neither frame has a Room
>    controls row, so it was removed from Trip Detail and then from Your room.
>    The stories still reach the screen with `go` steps, so the walkthrough is
>    fine, but nobody can browse to it. Needs a deliberate home.
> 2. **The phone screen is 368px wide; the artboards are 393.** Every ported
>    measurement is Figma's own, so anything depending on available width lands
>    differently — it already forced one deviation (Your room's carousel dots).
>    Making `PhoneFrame` 393 wide would fix this and every other ported screen at
>    once; not done because it moves every screen days before a rehearsal.

> **2026-09-09 — All-Hands polish pass + Agentation.** Ran the walkthrough end to
> end and worked through the feedback: opens straight on WhatsApp (no flash of the
> app), the WhatsApp follow-up line lands on a 3s timer with no press, tapping the
> link jumps straight to the pinned chat with the Inbox underneath, the Lumi chat
> header is gone, the Ask Lumi input matches Figma (including the typing → send
> state), the live status dot is the Figma component with an outward pulse, the
> inbox row is the Figma list item, and the iOS home/lock surfaces are 3x exports
> with the Numa icon baked in. The Dynamic Island now springs open. Also added
> **Agentation** so feedback can be given by clicking the running app rather than
> describing it — see AGENTS.md.
>
> Docs refreshed this session: `context.md` (was pre-Story-Mode), `decisions.md`
> (the why behind the engine, CSS-over-Framer, asset export), and AGENTS.md gained
> *Working notes* covering how to verify in the hidden preview pane. The three
> story-mode docs were folded into one current `story-mode.md`; consolidating them
> surfaced two unfixed P1s from the Jun-11 review (duplicate message and stale beat
> index on rapid `→`), both now fixed. Findings still open are listed in that file.

> **2026-09-08 — Second story: the All-Hands walkthrough.** Story Mode now hosts
> **two** scripts. `lib/demo/story.ts` (Sarah's Day) is **frozen** — its beats are
> untouched — and the engine was generalised into a registry (`lib/demo/stories.ts`)
> keyed by `demo.storyId`. The new **"It started with an air conditioner."** script
> (`lib/demo/allHands.ts`, 29 taps) follows the all-hands run-of-show: WhatsApp →
> "follow this in the app" (pinned status, inbox, Dynamic Island, lock screen) →
> the six-screen walk to Your room and the lights → ramen map → €20 late checkout →
> the train home and three London properties. Presenter reference:
> `docs/project/all-hands-story.md`. Stage is black for this round; `STORIES.allhands.scenes`
> is the single flag that brings the room/door scenes back (the beats already drive
> `smartRoom`).

> **2026-07-01 — WhatsApp removed (vision pivot).** The live Notion vision doc now scopes
> channels as **independent for MVP** — WhatsApp stays in WhatsApp, no cross-channel mirroring
> into the app inbox (the old "one WA topic = one app thread" bridging is now in the doc's
> "Won't Do" section). Accordingly the prototype is now **app-only**: the live "WhatsApp demo
> mode" (second phone, scenario buttons, `wa` store state, `setThreadTopic`-driven bridging) was
> deleted, and Sarah's Day story mode was converted so the Towels + AC beats happen in-app, with
> a new **unified-inbox** beat replacing the dual-phone "memory reveal". `docs/project/vision.md`
> is a stale mirror that still describes the old bridging model — refresh it from Notion.
>
> Also removed the **To-dos** and **PRD** sidebar tabs (not needed): deleted `TodosPanel.tsx`,
> `lib/todos.ts`, and the `/api/todos` route. Note the `@upstash/redis` dep stays — it's still
> used by `lib/ai/model.ts` for rate-limit cooldown persistence (a separate feature).

## Done

- **The Lumi knot in the story chat.** Both stories get it, and it replaces the
  torus PNG and the typing dots:
  - Vendored from `numa-lumi-branding`: `scripts/sync-lumi-knot.mjs` and
    `components/lumi-knot/`, plus `check:knot` for drift.
  - Placed over the chat's anchors by `components/chat/useKnotPlacement.ts`.
  - `shoot-story.mjs` asserts its position, size, glide or appear-in-place, fade,
    `←` snaps, one canvas, and no WebGL context warnings.

- **All-Hands opening frame + frosted stamp** — the Friday room opens as photographed (the lights-off dark starts behind the phone from the first press, keyed to the beat so the room can't relight on the way to Saturday); the time-and-place stamp sits on a frosted glass card
- **All-Hands photographic stage** — five photos, two focus modes (`scene` / `phone`), `glance` on room events, a `pulse` accent (the cool breath); `backdrop` transitions `night` / `part` (from the curtain seam) / `dissolve` / `travel`; time-and-place stamps; end card over the darkened train window
- **Stage asset pipeline** — `npm run stage:photos`: 18 MB of JPEGs → AVIF at 1920/2560 (38–183 KB each) + placeholders; per-photo scrim solved against the bands seen beside the phone; measured anchors (thermostat, seam, lamps)
- **`scripts/shoot-story.mjs`** — headless, real-timing run of a story with measured assertions, per-beat frames, contact sheet and transition strips
- **Phone centred in photo stories** — the hidden side panel no longer holds its 210px; the page no longer scrolls to chase the off-stage phone (`overflow: clip`)
- **`←` truly instant on the stage** — `stage.instant` during snaps; nothing mounted mid-snap animates afterwards

- **Type weight matches Figma** — the mislabelled 700/350 woff2s replaced with the DS's real 600/300 cuts, and every `font-medium` / `font-bold` snapped to the two weights that exist
- **Story chat spacing to Figma 7229-13293** — 24px gutters, 52px under the grabber, 32px after her turn, 24px between Lumi's messages and between a message's text and widget
- **Composer sits 24px off the screen foot** — was 48px; the sheet is flush with the phone screen, so the composer's bottom padding is that whole gap
- **Map walk connects its pins** — the dotted route now shares a coordinate system with the rating pill and the Numa pin at any width
- **Scripted taps have an affordance** — `tapReply` presses the matching quick-reply chip (and dims a tapped starter) before the message lands
- **Your room to Figma (7256-4436)** — hero scrim, pink title, exported dots, real amenity list; assets under `public/room/`
- **Trip Detail to Figma (7256-13081)** — hero, ticket-notched booking card, essential list, promo banners, Helpful tips; Figma assets committed under `public/trip/`; shared `ListItem` / `ListDivider` for the DS list row
- **Trip card badge to Figma (7256-11647)** — neutral outline Badge with trailing arrow; the duplicate "Access now" link under the card is gone
- **Rapid-input fixes in the story runner** — pressing `→` mid-typewriter used to push the message twice (verified: 2 before, 1 after); the cancelled typewriter now returns and lets the canceller own the push. Fast-forward reads the runner's own `activeBeatIndex` instead of a keydown closure that can go stale
- **All-Hands polish** — opens on WhatsApp via per-story `initialSurface`; WhatsApp follow-up auto-lands after 3s; direct jump into the pinned chat with the Inbox underneath (no Explore flash); no chat header; 32px under the sheet handle; 40px either side of the status rule
- **Ask Lumi input to Figma** — floating white pill + Elevation/1 shadow, exported mic glyph, and the typing state (blue-300 caret, dark send button with the exported arrow). No backdrop blur — it smeared the sheet's bottom corners
- **Live status dot** — Figma component (12px #e1f1e8 halo + 6px #1e7868 core) with an outward-pulsing ring so the request reads as a live feed
- **Inbox row to Figma** — Numa "Nu" avatar on brand pink, spec typography, 2px filter chips
- **iOS surfaces at 3x** — home screen (Numa icon now baked into the Figma frame), lock wallpaper and technician glyph re-exported via `download_figma_images` (`get_screenshot` can't exceed natural size)
- **Dynamic Island spring** — opens with an overshoot weighted into height (~8%; width only ~1%, which is all the rounded corners allow) over 560ms; closes without a bounce
- **Agentation** — dev-only annotation toolbar wired to the local sync server, so feedback arrives with selectors attached

- **Story Mode — All-Hands walkthrough (`?story=allhands`)** — second scripted story, 29 taps, bare chrome (no captions/rail/counter — the presenter is the narration); fully offline (no AI, no TTS, no mic)
- **Story engine — multi-story** — `STORIES` registry + `demo.storyId`; new Step kinds (`surface`, `island`, `waUserMsg/waTyping/waLumiMsg`, `startRequest/clearRequest`, `hideChat/showChat`, `divider`, `starters`, `stayVisible`); exhaustiveness guard on `applyStep`; `snapToBeat` now cancels a beat still playing (pressing ← mid-beat is safe)
- **Phone surfaces outside the app** — WhatsApp thread, plus the real iOS home screen and lock wallpaper exported from Figma, with a compact ⇄ expanded **Dynamic Island** and a lock-screen **Live Activity** drawn over them (Figma proportions, Figma technician asset); mounted in `PhoneFrame`, CSS-driven so they never fail to appear on stage
- **Live request model** — one `RequestState` + countdown (`lib/demo/request.ts`) behind three renderings (pinned card, island, lock activity) so the minutes never disagree
- **Your room screen** — new `yourRoom` screen (hero, room facts, amenities), reachable from Trip Detail
- **Per-story stay** — `useStay()` gives Explore / My Trips / Trip Detail / Your room the running story's stay (Berlin Friedrichshain, Jul 9–12); hides the trip card entirely on the train home
- **Shared Figma upgrades** — Inbox (title + filter chips), Ask Lumi start screen (torus + "I'm Lumi, your travel assistant" + starters), plain-text Lumi replies, FAB "Ask Lumi | Open door", ticket-style reservation card, full-width quick-reply buttons, real map widget, 200px property carousel
- **Dev handle** — `window.__lumi` (development only) exposes the store for console-driving the demo
- **Agentation visual feedback** — click an element in the running app, leave a note, and it reaches the agent with selector + position attached (`components/dev/Annotations.tsx`, mounted in `app/layout.tsx`, dev-only). Needs `npx agentation-mcp server` alongside `npm run dev`; see AGENTS.md

- **App shell & device frame** — iPhone frame wrapper, `AppShell` with animated screen transitions
- **Bottom navigation** — 4 tabs with Figma DS SVG icons; `text-text` (active) / `text-text-secondary` (inactive); `tripDetail` maps to trips tab
- **ChatSheet** — bottom sheet, spring animation, `rounded-t-[38px]`, grabber pill
- **ThreadView — idle / keyboard / active** — Numa wordmark + Lumi orb + starters + send
- **DS tokens** — full `@theme` in `app/globals.css`; TWK Lausanne font woff2 300 + 600
- **Zustand store** — `useApp()` with screen, chat, voice, inStay, threads, booking, tvShader
- **Screen shells** — Explore, MyTrips, TripDetail, Messages, Profile
- **Mock data** — threads, trips, properties in `lib/mock/`
- **Trip consistency** — Explore ↔ My Trips both read from `UPCOMING_TRIP` in `lib/mock/guest.ts`
- **FAB shiny border** — conic-gradient comet, solid `#ffc9d2` (no white core)
- **FAB — holographic cone on Doors button** — `lumi-cone.png` replaces SVG door icon
- **MyTripsScreen + TripDetailScreen** — Figma v2 faithful implementations
- **ProfileScreen** — Figma redesign: pink header, savings card with shadow, menu rows with inline SVGs
- **Project management md system** — CLAUDE.md, context/vision/decisions docs, skills
- **Voice design** — white bg, Figma 3D torus, waveform card with swipe gestures
- **In stay mode toggle** — SidePanel control; controls FAB Doors button + SmartRoomScene visibility
- **AI starters** — `/api/starters` generates context-aware conversation starters; 3-tier JSON parse
- **Messages badge** — only shown when unread threads exist
- **Booking flow (4 steps)** — Where → When → Guests → Results with city-aware listings
- **SidePanel + Settings modal** — permanent left sidebar (Sarah's Day + Settings); dark-mode modal
- **GitHub repo** — https://github.com/numa-tony/lumi-prototype
- **Vercel deployment** — https://numa-lumi-prototype.vercel.app (auto-deploys on push to main)
- **Smart room controls (fully working)** — `controlDevice` tool → `SmartRoomScene`; `inStay` auto-set on first device control or voice open; persisted to localStorage
- **Voice pipeline (fully working)** — Groq Whisper STT → `/api/chat` with tools → Kokoro TTS; synthetic confirmation; silence detection auto-send
- **Multi-provider fallback chain** — Gemini → Qwen3-32b → Llama-3.3-70b → Gemini2 → Llama-3.1-8b; Redis-persisted cooldowns; smart cooldown: 6h daily vs 90s per-minute
- **Room Controls screen** — "Room controls" list item in TripDetail → 2-column smart device tile grid (TV, AC, Lighting, Blinds, Nest mini, Spotlight); live state from store
- **TV Remote screen** — full remote UI: D-pad ring, volume + channel pills, back/play/mute row; tabs Remote / Channels; FAB + BottomNav hidden on this screen only
- **Pixel beams shader background** — WebGL halftone dot-grid on TV remote screen: blue-purple squares on pink, dot size driven by slow FBM noise blobs
- **TV shader live inspector** — "📺 TV SHADER" card in Settings: color pickers (bg + dot), Dither / Plasma / Animation sliders; all params stored in Zustand, passed as WebGL uniforms, update live without remount
- **Story Mode — full "Sarah's Day" (app-only)** — scripted presenter demo, right-arrow driven; single phone; PressBeat engine with typed step sequencer; StoryThreadView (in-app chat); typewriter; beats: Title → Arrival (door PIN + FrontDoorScene) → Room (lights + blinds) → Towels (in-app Q&A) → AC raised in the same chat, Lumi recognises it's a *separate issue* and splits it into a dedicated request thread (live status widget) → Inbox reveal (each request its own thread, unified inbox) → Ramen (quick-reply → map) → Late checkout (reservationCard + offer + accept) → Climax (Netflix + blinds + lights off) → "The End"; backward nav via snapToBeat; fast-forward on rapid →
- **Story Mode polish** — FrontDoorScene rainy arrival (framer-motion rain — CSS keyframes wouldn't advance in scene layer), closed→open door swing; window sky day/night (`windowSky` in smartRoom): morning for Sunday checkout, evening for climax; Stay thread pre-loaded in app inbox (RECENT, below Towels); "The End" card with Replay + Back to main; tap-vs-typewriter for quick-reply chips; title "Sarah's epic stay with Lumi"; larger keycap arrow hints
- **Story Mode voice climax** — `StoryVoiceView` (scripted, no mic): waveform + word-by-word transcript + Kokoro `af_sarah` TTS (distinct from Lumi's `af_heart`); 4 new step kinds (`voiceOpen/Close/Listen/Respond`); `speakAsSarah` awaits audio completion via `onended/onpause` promise so voice is never interrupted mid-phrase; L5 radial-gradient darkening overlay in SmartRoomScene fades in when lights off (transparent hole at TV position so Netflix glow shows through); fixed `roomBreakout` dead-state so room scene stays visible during dark climax; fixed Netflix casing (`"netflix"` → `"Netflix"`)

## In Progress

- **All-Hands stage** (branch `feat/allhands-stage`) — built and verified headless; needs a rehearsal on the real presentation machine
- **Lumi cube in the chat** (branch `feat/lumi-cube-chat`) — the start screen and the lab are in; the conversation state, the swap of `ThreadView`/`StoryThreadView` onto the shared chrome, and the bake are not
- **Rate limit exposure** — add `GOOGLE_GENERATIVE_AI_API_KEY_2` to `.env.local` + Vercel env for extra Gemini quota

## Next (ordered)

1. **Rehearse All-Hands on the real machine** — 32 taps now, with the new ◆ scene beats to talk over. Judge the knot's glide into the thread, and its thinking spin, at presentation size. Judge the stage's smoothness in a foreground browser at presentation size (the headless rig can't), and sign off the Lumi/Sarah copy in `lib/demo/allHands.ts`
2. **Friday lights-off render** — same room and framing, lamps off, the 26 °C still glowing; save as `1b-…` in `~/Downloads/Proto BG Photos/` and run `npm run stage:photos`
3. **Land the work** — three layers are uncommitted and stacked: the Figma fidelity pass (was on `main`'s working tree), the cube + chat lab (`feat/lumi-cube-chat`), and this stage (`feat/allhands-stage`). Decide how they go in
4. **Decide what the chat's thread state looks like** — the cube's white wash and its docked mark share one canvas (see the 2026-09-09 evening note)
5. **Move `ThreadView` and `StoryThreadView` onto `components/chat/lumi/`** — one start screen and one composer instead of two and three
6. **Bake the story's cube frames** from `/lab` via `scripts/shoot-lab.mjs`, so the presentation runs no live WebGL in the chat
7. **Give `roomControls` an entry point** — only reachable from the stories' `go` steps
8. **Decide on the 368 vs 393 screen width** — every ported screen is measured in Figma's 393px
9. **Refresh `docs/project/vision.md`** from the Notion doc (Notion wins)
10. **ExploreScreen image URLs** — Figma MCP asset URLs expired; replace with permanent ones
11. **ThreadView (live) parity** — the Figma styling and spacing from `StoryThreadView`

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
