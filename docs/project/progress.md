# Progress — Updated 2026-06-08

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
- **Voice mode** — `VoiceSheet.tsx` + `Waveform.tsx`; MediaRecorder → `/api/voice` (Gemini STT) → `/api/chat` → `/api/tts`; browser TTS fallback
- **Voice design** — white bg, Figma 3D torus (`public/lumi-torus.png`), waveform card with swipe gestures
- **In stay mode toggle** — DevBar → SidePanel control; controls FAB Doors button visibility
- **AI starters** — `/api/starters` generates context-aware conversation starters; ThreadView fetches once per keyboard open
- **Messages badge** — only shown when unread threads exist
- **Booking flow (4 steps)** — Where → When → Guests → Results with city-aware listings
- **SidePanel + Settings/Todos modals** — permanent left sidebar; dark-mode modals; todos Kanban with priority, delete, status edit
- **Todo persistence** — Upstash Redis via Vercel Marketplace (`upstash-kv-citron-envelope`); localStorage cache + server sync on save
- **GitHub repo** — https://github.com/numa-tony/lumi-prototype
- **Vercel deployment** — https://numa-lumi-prototype.vercel.app (auto-deploys on push to main)
- **Local env vars fixed** — `.env.local` has KV Redis vars + Google AI key; app fully functional locally
- **WhatsApp demo mode** — dual phone layout; second iPhone styled as WA; real Gemini responses via WA hint; thread bridging via `setThreadTopic`; topic markers (🛁🧊) in WA linear stream; 6-step "Sarah's day" scenario buttons; channel asymmetry (app→WA silent) demonstrated live; WA state persisted to localStorage
- **WA widget deep-links** — widget tool parts in WA bubbles render as tappable "Open in Lumi ↗" links (blue, bordered) pointing to the Vercel deployment instead of plain text labels
- **Modal scrollability** — Settings panel now scrollable; both modals respect `max-h-[80vh]` correctly
- **AI model stabilised** — switched default to `gemini-2.5-flash-lite` (only free-tier model with quota available); improved error messages (rate-limit vs generic); try/catch in `/api/chat` route

## In Progress

- **Voice TTS validation** — Gemini TTS endpoint deployed; needs live confirmation audio plays back correctly

## Next (ordered)

1. **Cross-channel thread logic design** — align with Oliver/Matthew on thread identity, split rules, and channel continuity before building further (Oliver meeting context captured)
2. **MessagesScreen (inbox)** — Figma-faithful design, replace direct THREADS import with store reads
3. **ExploreScreen image URLs** — Figma MCP asset URLs expired ~Jun 8; replace with permanent CDN URLs
4. **ThreadView rich widgets** — quick-reply chips, reservation card, in-thread status widget
5. **WA demo polish** — timestamp metadata on ops-update/outbound messages; "app only" silent toast on WA phone for S4

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
