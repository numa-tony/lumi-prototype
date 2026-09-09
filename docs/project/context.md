# Lumi Prototype — Session Context

A Next.js web prototype demonstrating the Lumi in-app UX vision for Numa Stays.
Built to validate and iterate on screen designs before production implementation.
Not a production app — no real auth, no real data, AI via Gemini free tier.

Two things live here: the **app** (a browsable prototype with a live AI chat) and
**Story Mode** (scripted, offline presenter demos that drive the same app).

## Tech stack

- **Next.js 16 App Router** (Turbopack) — check `node_modules/next/dist/docs/` for version-specific APIs
- **React 19** · **TypeScript**
- **Tailwind CSS v4** — all tokens in `@theme {}` block in `app/globals.css`; no tailwind.config
- **Zustand** — `useApp()` from `lib/store.ts`, persisted to localStorage
- **Framer Motion** — sheet/screen transitions (see the caveat under *Working notes*)
- **AI SDK v6** — `useChat`, `DefaultChatTransport`; Gemini with a multi-provider fallback chain
- **TWK Lausanne** — font-weight 300 (body) and 600 (headings/labels) only
- Deployed on Vercel: https://numa-lumi-prototype.vercel.app (auto-deploys on push to `main`)

## Screens

`explore` · `trips` · `tripDetail` · `yourRoom` · `roomControls` · `tvRemote` ·
`messages` · `profile`

Defined in `lib/types.ts` (`ScreenId`), mounted in `components/device/AppShell.tsx`.
`tripDetail`, `yourRoom` and `roomControls` all activate the **My Trips** tab.
`tvRemote` hides the FAB and bottom nav. The booking flow is a sheet
(`bookingOpen`), not a screen.

## Story Mode

Scripted presenter demos, driven by `→` / `Space` (advance), `←` (back, snaps
instantly), `Esc` (exit). Entirely offline — no AI, no TTS, no mic, no network.

Two stories, registered in `lib/demo/stories.ts` and keyed by `demo.storyId`:

| Story | Entry | Notes |
|---|---|---|
| **Sarah's Day** | sidebar, or `?story` | The original. **Frozen** — beats must not change |
| **All-Hands** | sidebar, or `?story=allhands` | "It started with an air conditioner." 29 taps. See `all-hands-story.md` |

```
lib/demo/
  types.ts        the Step vocabulary, PressBeat, Story  ← start here
  stories.ts      the registry (both stories)
  story.ts        Sarah's Day beats (FROZEN)
  allHands.ts     All-Hands beats + ALLHANDS_STAY
  storyRunner.ts  applyStep / playBeat / snapToBeat / fastForwardCurrent
  request.ts      RequestState + live countdown
  stay.ts         useStay() — per-story stay data for the app screens
  scenes.ts       useStoryScenes() — whether world scenes render

components/demo/
  StoryDirector.tsx   keyboard + playback orchestration
  StoryStage.tsx      stage chrome ("full" for Sarah's Day, "bare" for All-Hands)
  surfaces/           phone surfaces outside the app:
                      WhatsApp · iOS home · iOS lock · Dynamic Island · Live Activity
```

Adding a story = a beats file + a registry entry. Adding a beat capability = a
new `Step` kind in `types.ts` + a case in `storyRunner.applyStep` (there is an
exhaustiveness guard, so a missing case is a compile error).

## Key file map

```
app/
  globals.css          DS tokens (@theme), font-face, .no-scrollbar, .fab-border,
                       lumi-typing, surface-enter, live-dot-pulse
  layout.tsx           html/body + <Annotations /> (dev-only feedback toolbar)
  page.tsx             SmartRoomScene + FrontDoorScene + StoryDirector + SidePanel + PhoneFrame

components/
  device/PhoneFrame.tsx  iPhone shell — status bar, notch, home indicator, <PhoneSurface />
  device/AppShell.tsx    screen swap + Fab + BottomNav + ChatSheet + voice sheets
  device/SidePanel.tsx   left sidebar — story entries + Settings
  nav/Fab.tsx            "Ask Lumi | Open door" pill (fab-border)
  nav/BottomNav.tsx      Explore · My Trips · Inbox · My Profile
  chat/ChatSheet.tsx     bottom sheet wrapper (spring, rounded-t-[38px])
  chat/ThreadView.tsx    the LIVE chat (AI-backed)
  chat/StoryThreadView.tsx  the SCRIPTED chat — start screen, composer, pinned request
  chat/widgets/          reservationCard · quickReply · mapWidget · propertyCarousel · …
  screens/               one file per ScreenId
  dev/Annotations.tsx    Agentation toolbar (dev only)

lib/
  store.ts             Zustand — screen, chat, inStay, smartRoom, threads, demo{...}
  types.ts             ScreenId, ChatContext, Thread, WidgetData
  demo/                 Story Mode (above)
  mock/                static data (threads, trips, properties, guest)
  ai/                  AI SDK config, tools, model fallback chain
```

## DS conventions (from app/globals.css @theme)

**Colors (use the token, not the hex):**
- `text-text` = #191919 (content/base/default) · `text-text-secondary` = #6d706f
- `text-text-disabled` = #b2b2b2
- `bg-surface` = #ffffff · `bg-surface-muted` / `bg-[var(--color-bg-secondary)]` = #f4f4f4
- `border-line` = #dedddb · `border-line-light` = #eceae7
- `--color-numa` = #ff671f (orange accent) · `--color-lumi-pink` / `--color-brand-pink` = #ffc9d2
- Greens: `--color-green-100` #e1f1e8 · `--color-green-200` #c2e2d1 · `--color-green-400` #1e7868
- `--color-blue-300` = #176ecc (text caret)

**Spacing:** xs=8 · s=12 · m=16 · l=20 · xl=24 · 2xl=32 · 3xl=40 · 4xl=48
**Radius:** s=4 · m=8 · l=16 · full=999
**Font:** TWK Lausanne — `font-light` (300) body, `font-semibold` (600) labels/headings.

Phone geometry: the frame is 390×844 with 11px bezel padding, so **the screen is
368×822 CSS px**. Figma artboards are 402×874 — scale accordingly, or express
sizes as percentages so they track the frame.

## Figma

File key: `XAzcIpXCZYGvMwsNYWNUZg` (Lumi Vision). The All-Hands frames live on the
**🎙️ T2 2026 All Hands Prep** page.

| Screen | Node |
|--------|------|
| FAB pill | 6747-429 |
| Chat — idle / keyboard | 6747-495 / 6747-465 |
| Ask Lumi input — idle / typing | 7224-10876 / 7158-25269 |
| Chat with pinned request | 7224-10842 |
| Inbox | 7224-10569 · list item 7224-10605 |
| Live status dot | 7224-10821 |
| iOS home / expanded island / lock | 7227-12254 / 7227-12592 / 7227-12539 |
| Explore · My Trips · Trip Detail · Your room | 7256-11630 / 11842 / 13081 / 4436 |
| Map · checkout · London carousel | 7228-13058 / 7229-13293 / 7263-28250 |

`/lumi-screen <name>` or the Figma MCP fetches any node.

## Read on demand

- `docs/project/all-hands-story.md` — the All-Hands walkthrough: every tap, and how it's built
- `docs/project/decisions.md` — **read before changing an established pattern**
- `docs/project/story-mode.md` — the original Sarah's Day engine write-up
- **Vision — source of truth:** Notion "Doc — Lumi Architecture & UX Vision"
  (https://app.notion.com/p/numastays/Doc-Lumi-Architecture-UX-Vision-357a39b9f20480769deaca9797dabc1b).
  `docs/project/vision.md` is a **stale** local mirror (still describes the dropped
  cross-channel bridging model) — refresh from Notion; Notion wins.
