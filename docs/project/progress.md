# Progress — Updated 2026-06-03 (voice)

## Done

- **App shell & device frame** — iPhone frame wrapper, `AppShell` with animated screen transitions
- **Bottom navigation** — 4 tabs with Figma DS SVG icons; `text-text` (active) / `text-text-secondary` (inactive); `tripDetail` maps to trips tab
- **ChatSheet** — bottom sheet, spring animation, `rounded-t-[38px]`, grabber pill
- **ThreadView — idle state** — Numa wordmark + Lumi orb + "Ask anything" input
- **ThreadView — keyboard mode** — 3 starters + visual iOS keyboard + send button
- **DS tokens** — full `@theme` in `app/globals.css`
- **TWK Lausanne font** — woff2 weights 300 + 600
- **Zustand store** — `useApp()` with screen, chat, openChat, closeChat, go
- **Screen shells** — Explore, MyTrips, TripDetail, Messages, Profile
- **Mock data** — threads, trips, properties in `lib/mock/`
- **Trip consistency (Explore ↔ My Trips)** — both read YAYS Amsterdam from single `UPCOMING_TRIP` source in `lib/mock/guest.ts`; matching "Check-in required" badge + image; `openTrip("amsterdam")` everywhere
- **FAB shiny border** — Ryan Mulligan technique: `border: 2px solid transparent` + `background-clip: padding-box, border-box` with conic-gradient comet (pink → white → pink) animated via `@property --fab-gradient-angle`
- **MyTripsScreen (Figma v2)** — Figma node 7242-32301: 36px H1, filter tabs (Current/Past/Cancelled), warning badge, "Add missing reservation" tertiary button
- **TripDetailScreen (Figma v2)** — Figma node 7242-32467: pink hero bg + Amsterdam color `#d31779`, room photos, check-in/out dates card with dashed divider, "Check-in now" CTA, essential list (Your room + Manage booking), promo banners (extras + member benefits), Helpful tips with Arrival/Staying/Departing chips
- **Project management md system** — CLAUDE.md auto-loads context+progress; `docs/project/{context,vision,decisions}.md`; `/wrap-session` + `/lumi-screen` skills
- **Voice mode** — `components/voice/VoiceSheet.tsx` + `Waveform.tsx`; Web Speech API STT + Web Speech Synthesis TTS + Web Audio API waveform; FAB → text chat → "Speak" pill → voice overlay; threads auto-saved to Messages on first turn; voice-optimised AI hint (1–2 sentence replies for TTS); Chrome auto-restart guard for `continuous` mode

## In Progress

- **Voice mode — browser testing** — code complete; needs live test in headed Chrome for mic/TTS validation

## Next (ordered)

1. **Execute persistent messages plan** — tasks #1–8 in plan file
2. **MessagesScreen (inbox)** — replace direct THREADS import with store reads (part of persist plan)
3. **ExploreScreen** — location/property browsing polish with FAB in explore context
4. **Real AI integration end-to-end** — verify Gemini stream + tool calls in ThreadView active mode
5. **ThreadView rich widgets** — reservation card, quick-reply chips, in-thread status widget

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- WhatsApp channel integration
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
