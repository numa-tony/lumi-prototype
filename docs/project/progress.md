# Progress — Updated 2026-06-02

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
- **FAB shiny border** — Ryan Mulligan technique: `border: 2px solid transparent` + `background-clip: padding-box, border-box` with conic-gradient comet (pink → white → pink) animated via `@property --fab-gradient-angle`. Static pink→teal gradient temporarily removed; only comet visible. Outer radius now 18px to match border-box; inner div stays 16px.
- **Project management md system** — CLAUDE.md auto-loads context+progress; `docs/project/{context,vision,decisions}.md`; `/wrap-session` + `/lumi-screen` skills

## In Progress

- **FAB shine — visual QA** — Ryan Mulligan port awaiting browser confirmation
- **ThreadView — active chat mode** — message bubbles, composer, scroll to bottom
- **Persistent Messages & Reset (planned, not started)** — plan approved at `~/.claude/plans/lets-work-on-the-floofy-alpaca.md`. Adds zustand persist + `PersistedThread`, empty Messages by default, FAB chats persist as threads, DevBar with Reset / Load demo, `setThreadTopic` tool for AI naming.

## Next (ordered)

1. **Execute persistent messages plan** — tasks #1–8 in TaskList
2. **TripDetailScreen** — currently still reads Berlin Novela from `GUEST.stay`; align with YAYS Amsterdam
3. **MessagesScreen (inbox)** — replace direct THREADS import with store reads (part of persist plan)
4. **ExploreScreen** — location/property browsing polish with FAB in explore context
5. **Real AI integration end-to-end** — verify Gemini stream + tool calls in ThreadView active mode
6. **ThreadView rich widgets** — reservation card, quick-reply chips, in-thread status widget

## Deferred (not in prototype scope)

- Predictive nudges
- Live Activity / lock screen widgets
- WhatsApp channel integration
- Ops/Shine sync
- AI thread auto-classification (continuation vs new) — v2 of persistent messages
