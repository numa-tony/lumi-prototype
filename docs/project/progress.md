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

## In Progress

- **Voice TTS validation** — Gemini TTS endpoint deployed; needs live confirmation audio plays back correctly

## Next (ordered)

1. **ExploreScreen image URLs** — Figma MCP asset URLs expire ~7 days from Jun 1; replace with permanent CDN URLs
2. **MessagesScreen (inbox)** — Figma-faithful design, replace direct THREADS import with store reads
3. **ThreadView rich widgets** — quick-reply chips, reservation card, in-thread status widget
4. **Real AI end-to-end** — verify Gemini stream + tool calls fire correctly in ThreadView active mode
5. **WA demo polish** — add timestamp metadata to ops-update/outbound messages; scenario step "app only" silent toast on WA phone

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
