# Lumi Prototype — Session Context

A Next.js web prototype demonstrating the Lumi in-app UX vision for Numa Stays.
Built to validate and iterate on screen designs before production implementation.
Not a production app — no real auth, no real data, AI via Gemini free tier.

## Tech stack

- **Next.js App Router** — check `node_modules/next/dist/docs/` for version-specific APIs
- **Tailwind CSS v4** — all tokens in `@theme {}` block in `app/globals.css`; no tailwind.config
- **Zustand** — `useApp()` from `lib/store.ts`; actions: `go`, `openChat`, `closeChat`
- **Framer Motion** — sheet/screen transition animations
- **AI SDK v6** — `useChat`, `DefaultChatTransport`; Gemini model, swappable
- **TWK Lausanne** — font-weight 300 (body) and 600 (headings/labels) only

## Screens

`explore` | `trips` | `tripDetail` | `messages` | `profile`

Defined in `lib/types.ts` (ScreenId). Mounted in `components/device/AppShell.tsx`.
`tripDetail` activates the trips tab in BottomNav (not a separate tab).

## Key file map

```
app/
  globals.css          DS tokens (@theme), font-face, .no-scrollbar, .fab-border, lumi-typing
  layout.tsx           device frame wrapper
  page.tsx             mounts AppShell

components/
  device/AppShell.tsx  shell: AnimatePresence screen swap + Fab + BottomNav + ChatSheet
  nav/Fab.tsx          "Ask AI | Doors" pill — fab-border class, context-aware openChat
  nav/BottomNav.tsx    4-tab nav — inline SVG icons, text-text / text-text-secondary
  chat/ChatSheet.tsx   bottom sheet wrapper (spring animation, rounded-t-[38px])
  chat/ThreadView.tsx  idle / keyboard / active chat states
  screens/
    ExploreScreen.tsx
    MyTripsScreen.tsx
    TripDetailScreen.tsx
    MessagesScreen.tsx
    ProfileScreen.tsx

lib/
  store.ts             Zustand store — screen, chat, openChat, closeChat, go
  types.ts             ScreenId, ChatContext, Thread types
  mock/                static mock data (threads, trips, properties)
  ai/                  AI SDK config + chat transport
```

## DS conventions (from app/globals.css @theme)

**Colors (use Tailwind token, not hex):**
- `text-text` = #191919 (content/base/default — active, selected)
- `text-text-secondary` = #6d706f (content/base/secondary — inactive)
- `text-text-disabled` = #b2b2b2
- `bg-surface` = #ffffff · `bg-surface-muted` / `bg-[var(--color-bg-secondary)]` = #f4f4f4
- `border-line` = #dedddb · `border-line-light` = #eceae7
- `text-[color-numa]` = #ff671f (orange accent / Lumi brand)
- Brand pink: `--color-lumi-pink` = #ffc9d2

**Spacing:** xs=8 · s=12 · m=16 · l=20 · xl=24 · 2xl=32 · 3xl=40 · 4xl=48

**Radius:** s=4 · m=8 · l=16 · full=999

**Font:** TWK Lausanne. Use `font-light` (300) for body, `font-semibold` (600) for labels/headings.

## Figma

File key: `XAzcIpXCZYGvMwsNYWNUZg` (Lumi Vision file)

| Screen | Node ID |
|--------|---------|
| FAB pill | 6747-429 |
| Chat — idle (Ask anything) | 6747-495 |
| Chat — keyboard mode | 6747-465 |
| Messages inbox | (fetch from Figma to confirm) |

Use `/lumi-screen <name>` skill or Figma MCP directly to fetch any node.

## Read on demand

- **Vision — source of truth:** Notion doc "Doc — Lumi Architecture & UX Vision"
  (https://app.notion.com/p/numastays/Doc-Lumi-Architecture-UX-Vision-357a39b9f20480769deaca9797dabc1b).
  Read via the Notion MCP before design/arch work. `docs/project/vision.md` is a local mirror
  of it — refresh from Notion when they diverge; Notion wins.
- `docs/project/decisions.md` — prototype tech choices (read before changing established patterns)
