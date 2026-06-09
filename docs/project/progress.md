# Progress — Updated 2026-06-09

## Done

- **App shell & device frame** — iPhone frame wrapper, `AppShell` with animated screen transitions
- **Bottom navigation** — 4 tabs with Figma DS SVG icons; `text-text` (active) / `text-text-secondary` (inactive); `tripDetail` maps to trips tab
- **ChatSheet** — bottom sheet, spring animation, `rounded-t-[38px]`, grabber pill
- **ThreadView — idle / keyboard / active** — Numa wordmark + Lumi orb + starters + send
- **DS tokens** — full `@theme` in `app/globals.css`; TWK Lausanne font woff2 300 + 600
- **Zustand store** — `useApp()` with screen, chat, voice, inStay, threads, booking, wa
- **Screen shells** — Explore, MyTrips, TripDetail, Messages, Profile
- **Mock data** — threads, trips, properties in `lib/mock/`
- **Trip consistency** — Explore ↔ My Trips both read from `UPCOMING_TRIP` in `lib/mock/guest.ts`
- **FAB shiny border** — conic-gradient comet, solid `#ffc9d2` (no white core)
- **FAB on all screens** — visible on Profile and all other screens
- **MyTripsScreen + TripDetailScreen** — Figma v2 faithful implementations
- **ProfileScreen** — Figma redesign: pink header, savings card with shadow, menu rows with inline SVGs, `#9162CA` since-2024 badge
- **Project management md system** — CLAUDE.md, context/vision/decisions docs, skills
- **Voice design** — white bg, Figma 3D torus (`public/lumi-torus.png`), waveform card with swipe gestures
- **In stay mode toggle** — DevBar → SidePanel control; controls FAB Doors button visibility
- **AI starters** — `/api/starters` generates context-aware conversation starters; ThreadView fetches once per keyboard open; 3-tier JSON parse prevents "json" / "[" literals
- **Messages badge** — only shown when unread threads exist
- **Booking flow (4 steps)** — Where → When → Guests → Results with city-aware listings
- **SidePanel + Settings/Todos modals** — permanent left sidebar; dark-mode modals; todos Kanban with priority, delete, status edit
- **Todo persistence** — Upstash Redis via Vercel Marketplace; localStorage cache + server sync on save
- **GitHub repo** — https://github.com/numa-tony/lumi-prototype
- **Vercel deployment** — https://numa-lumi-prototype.vercel.app (auto-deploys on push to main)
- **WhatsApp demo mode** — dual phone layout; real Gemini responses; thread bridging; topic markers; 6-step "Sarah's day" scenario; channel asymmetry; WA state persisted
- **WA widget deep-links** — tool parts render as tappable "Open in Lumi ↗" links
- **Modal scrollability** — Settings panel scrollable; modals respect `max-h-[80vh]`
- **Smart room controls (fully working)** — `controlDevice` tool → `SmartRoomScene` background animates behind phone; `inStay` auto-set on first device control or voice open; persisted to localStorage; WA blocked at API level with redirect message
- **Voice pipeline (fully working)** — Groq Whisper STT (Gemini fallback) → `/api/chat` with tools → Kokoro TTS (browser TTS fallback); synthetic confirmation if model returns no text; silence detection auto-send
- **Multi-provider fallback chain** — Gemini → Qwen3-32b → Llama-3.3-70b → Gemini2 (second key slot) → Llama-3.1-8b; cooldowns persisted to Redis (survives cold starts); smart cooldown: 6h daily exhaustion vs 90s per-minute

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
