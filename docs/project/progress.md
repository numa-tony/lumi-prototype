# Progress — Updated 2026-09-09

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
> *Working notes* covering how to verify in the hidden preview pane.

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

- **Rate limit exposure** — add `GOOGLE_GENERATIVE_AI_API_KEY_2` to `.env.local` + Vercel env for extra Gemini quota

## Next (ordered)

1. **Rehearse the All-Hands walkthrough** — run it end to end at presentation size and tune Lumi/Sarah copy in `lib/demo/allHands.ts` (copy is drafted, not signed off)
2. **Backgrounds for the All-Hands story** — flip `STORIES.allhands.scenes` to `true` and design what sits behind the phone per beat (the `scene` steps are already in the script)
3. **Refresh `docs/project/vision.md`** — stale mirror still describes the deprecated cross-channel bridging model; sync from the live Notion doc (Notion wins)
4. **ExploreScreen image URLs** — Figma MCP asset URLs expired ~Jun 8; replace with permanent CDN URLs
5. **ThreadView (live) parity** — carry the Figma chat styling from `StoryThreadView` into the live `ThreadView`

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
