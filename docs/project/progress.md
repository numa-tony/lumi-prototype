# Progress — Updated 2026-06-12

## Done

- **App shell & device frame** — iPhone frame wrapper, `AppShell` with animated screen transitions
- **Bottom navigation** — 4 tabs with Figma DS SVG icons; `text-text` (active) / `text-text-secondary` (inactive); `tripDetail` maps to trips tab
- **ChatSheet** — bottom sheet, spring animation, `rounded-t-[38px]`, grabber pill
- **ThreadView — idle / keyboard / active** — Numa wordmark + Lumi orb + starters + send
- **DS tokens** — full `@theme` in `app/globals.css`; TWK Lausanne font woff2 300 + 600
- **Zustand store** — `useApp()` with screen, chat, voice, inStay, threads, booking, wa, tvShader
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
- **SidePanel + Settings/Todos modals** — permanent left sidebar; dark-mode modals; todos Kanban
- **Todo persistence** — Upstash Redis via Vercel Marketplace; localStorage cache + server sync
- **GitHub repo** — https://github.com/numa-tony/lumi-prototype
- **Vercel deployment** — https://numa-lumi-prototype.vercel.app (auto-deploys on push to main)
- **WhatsApp demo mode** — dual phone layout; real Gemini; thread bridging; 6-step "Sarah's day" scenario
- **WA widget deep-links** — tool parts render as tappable "Open in Lumi ↗" links
- **Smart room controls (fully working)** — `controlDevice` tool → `SmartRoomScene`; `inStay` auto-set on first device control or voice open; persisted to localStorage
- **Voice pipeline (fully working)** — Groq Whisper STT → `/api/chat` with tools → Kokoro TTS; synthetic confirmation; silence detection auto-send
- **Multi-provider fallback chain** — Gemini → Qwen3-32b → Llama-3.3-70b → Gemini2 → Llama-3.1-8b; Redis-persisted cooldowns; smart cooldown: 6h daily vs 90s per-minute
- **Room Controls screen** — "Room controls" list item in TripDetail → 2-column smart device tile grid (TV, AC, Lighting, Blinds, Nest mini, Spotlight); live state from store
- **TV Remote screen** — full remote UI: D-pad ring, volume + channel pills, back/play/mute row; tabs Remote / Channels; FAB + BottomNav hidden on this screen only
- **Pixel beams shader background** — WebGL halftone dot-grid on TV remote screen: blue-purple squares on pink, dot size driven by slow FBM noise blobs
- **TV shader live inspector** — "📺 TV SHADER" card in Settings: color pickers (bg + dot), Dither / Plasma / Animation sliders; all params stored in Zustand, passed as WebGL uniforms, update live without remount
- **Story Mode — full "Sarah's Day" (27 beats)** — scripted presenter demo, right-arrow driven; PressBeat engine with typed step sequencer; StoryThreadView (in-app), WaStoryView (WA phone); typewriter in both channels; beats: Title → Arrival (door PIN + FrontDoorScene) → Room (lights + blinds) → Towels (WA cross-channel, thread bridges to inbox) → AC (WA status widget + inbox) → Ramen (quick-reply → map) → Late checkout (reservationCard + offer + accept) → Climax (Netflix + blinds + lights off) → "The End"; backward nav via snapToBeat; fast-forward on rapid →
- **Story Mode polish** — FrontDoorScene rainy arrival (framer-motion rain — CSS keyframes wouldn't advance in scene layer), closed→open door swing; window sky day/night (`windowSky` in smartRoom): morning for Sunday checkout, evening for climax; Stay thread pre-loaded in app inbox (RECENT, below Towels); "The End" card with Replay + Back to main; tap-vs-typewriter for quick-reply chips; title "Sarah's epic stay with Lumi"; larger keycap arrow hints
- **Story Mode voice climax** — `StoryVoiceView` (scripted, no mic): waveform + word-by-word transcript + Kokoro `af_sarah` TTS (distinct from Lumi's `af_heart`); 4 new step kinds (`voiceOpen/Close/Listen/Respond`); `speakAsSarah` awaits audio completion via `onended/onpause` promise so voice is never interrupted mid-phrase; L5 radial-gradient darkening overlay in SmartRoomScene fades in when lights off (transparent hole at TV position so Netflix glow shows through); fixed `roomBreakout` dead-state so room scene stays visible during dark climax; fixed Netflix casing (`"netflix"` → `"Netflix"`)

## In Progress

- **Rate limit exposure** — add `GOOGLE_GENERATIVE_AI_API_KEY_2` to `.env.local` + Vercel env for extra Gemini quota

## Next (ordered)

1. **Cross-channel thread logic design** — align with Oliver/Matthew on thread identity, split rules, and channel continuity
2. **MessagesScreen (inbox)** — Figma-faithful design, replace direct THREADS import with store reads
3. **ExploreScreen image URLs** — Figma MCP asset URLs expired ~Jun 8; replace with permanent CDN URLs
4. **ThreadView rich widgets** — quick-reply chips, reservation card, in-thread status widget
5. **WA demo polish** — timestamp metadata on ops-update/outbound messages; "app only" silent toast on WA phone for S4

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
