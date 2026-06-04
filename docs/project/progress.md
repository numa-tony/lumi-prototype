# Progress — Updated 2026-06-03

## Done

- **App shell & device frame** — iPhone frame wrapper, `AppShell` with animated screen transitions
- **Bottom navigation** — 4 tabs with Figma DS SVG icons; `text-text` (active) / `text-text-secondary` (inactive); `tripDetail` maps to trips tab
- **ChatSheet** — bottom sheet, spring animation, `rounded-t-[38px]`, grabber pill
- **ThreadView — idle / keyboard / active** — Numa wordmark + Lumi orb + starters + send
- **DS tokens** — full `@theme` in `app/globals.css`; TWK Lausanne font woff2 300 + 600
- **Zustand store** — `useApp()` with screen, chat, voice, inStay, threads, booking
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
- **In stay mode toggle** — DevBar prototype control; controls FAB Doors button visibility
- **AI starters** — `/api/starters` generates context-aware conversation starters; ThreadView fetches once per keyboard open
- **Messages badge** — only shown when unread threads exist
- **Booking flow (4 steps)** — Where (city search) → When (date range calendar) → Guests (steppers) → Results (city-aware property listings, search summary pill, pink price badge, floating List/Map toggle)
- **GitHub repo** — https://github.com/numa-tony/lumi-prototype
- **Vercel deployment** — https://numa-lumi-prototype.vercel.app (auto-deploys on push to main)

## In Progress

- **Voice TTS validation** — Gemini TTS endpoint deployed; needs live confirmation audio plays back correctly

## Next (ordered)

1. **ThreadView rich widgets** — quick-reply chips, reservation card, in-thread status widget
2. **MessagesScreen (inbox)** — Figma-faithful design, replace direct THREADS import with store reads
3. **Demo thread quality** — "Sarah's day" walkthrough: AC broken → In Progress, Towels → resolved, Ramen Q&A
4. **Real AI end-to-end** — verify Gemini stream + tool calls fire correctly in ThreadView active mode
5. **ExploreScreen image URLs** — Figma MCP asset URLs expire ~7 days from Jun 1; replace with permanent CDN URLs

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- WhatsApp channel integration
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
