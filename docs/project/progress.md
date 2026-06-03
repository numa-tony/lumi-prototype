# Progress — Updated 2026-06-03 (deploy)

## Done

- **App shell & device frame** — iPhone frame wrapper, `AppShell` with animated screen transitions
- **Bottom navigation** — 4 tabs with Figma DS SVG icons; `text-text` (active) / `text-text-secondary` (inactive); `tripDetail` maps to trips tab
- **ChatSheet** — bottom sheet, spring animation, `rounded-t-[38px]`, grabber pill
- **ThreadView — idle / keyboard / active** — Numa wordmark + Lumi orb + starters + send
- **DS tokens** — full `@theme` in `app/globals.css`; TWK Lausanne font woff2 300 + 600
- **Zustand store** — `useApp()` with screen, chat, voice, inStay, threads
- **Screen shells** — Explore, MyTrips, TripDetail, Messages, Profile
- **Mock data** — threads, trips, properties in `lib/mock/`
- **Trip consistency** — Explore ↔ My Trips both read from `UPCOMING_TRIP` in `lib/mock/guest.ts`
- **FAB shiny border** — conic-gradient comet animation via `@property --fab-gradient-angle`
- **MyTripsScreen + TripDetailScreen** — Figma v2 faithful implementations
- **Project management md system** — CLAUDE.md, context/vision/decisions docs, skills
- **Voice mode** — `VoiceSheet.tsx` + `Waveform.tsx`; MediaRecorder → `/api/voice` (Gemini STT) → `/api/chat` → `/api/tts` (Gemini TTS, voice "Kore"); auto-starts recording on open; browser TTS fallback; response text shown visually
- **Voice design** — white bg, Figma 3D torus image (`public/lumi-torus.png`), waveform card with swipe gestures (swipe left cancel, swipe up send)
- **In stay mode toggle** — DevBar prototype control (top-left, outside device frame); off by default; controls FAB Doors button visibility
- **GitHub repo** — https://github.com/numa-tony/lumi-prototype
- **Vercel deployment** — https://numa-lumi-prototype.vercel.app (under `numa` Vercel team; auto-deploys on push to main)

## In Progress

- **Voice TTS validation** — Gemini TTS endpoint deployed; needs live confirmation that audio plays back correctly (browser speech-synthesis fallback is in place)

## Next (ordered)

1. **Execute persistent messages plan** — tasks #1–8 in plan file
2. **MessagesScreen (inbox)** — replace direct THREADS import with store reads
3. **ExploreScreen** — location/property browsing polish
4. **Real AI integration end-to-end** — verify Gemini stream + tool calls in ThreadView active mode
5. **ThreadView rich widgets** — reservation card, quick-reply chips, in-thread status widget

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- WhatsApp channel integration
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
