# Technical Decisions — Lumi Prototype

Decisions made during prototype development. Read before changing an established pattern.

---

## FAB gradient border — `::before` technique

**Chosen:** CSS `::before` pseudo-element at `inset: -2px; z-index: -1; background: gradient`.
The outer wrapper has `position: relative` (from `.fab-border` class in globals.css) but
NO stacking context (no backdrop-filter, no z-index set). This keeps `::before` in the
ancestor stacking context so it renders below the outer wrapper, not inside it.
The inner div with `background: rgba(255,255,255,0.85)` + `backdrop-filter: blur(7px)` +
`overflow: hidden` + `border-radius: 16px` covers the gradient center.

**CSS class:** `.fab-border` in `app/globals.css`. Border radius on `::before` = element
radius + 2px (e.g. element=16px → ::before=18px).

**Outer wrapper must NOT have:** `overflow: hidden` (clips ::before) or `backdrop-filter`
(creates stacking context, gradient bleeds through).

**Prior approach:** `mask-composite: exclude` with `padding-box` (also correct, clean corners,
but more verbose). User explicitly requested switching to the foolishdeveloper.com technique.

---

## Bottom nav icons — inline SVG paths

**Chosen:** SVG path data inlined in `BottomNav.tsx`, `fill="currentColor"`. No icon library.
Paths extracted directly from Figma DS export (masks removed — viewBox clips to 24×24
identically). Active state uses filled/heavier path variant; inactive uses outlined variant.
Color driven by Tailwind class on parent button: `text-text` (active) / `text-text-secondary` (inactive).

**Why not an icon library:** Figma exports the exact DS paths. Importing a library would
introduce paths that may not match the DS exactly.

---

## State management — Zustand

Single `useApp()` hook from `lib/store.ts`. No React Context, no Redux.
Sufficient for prototype scope. Store shape: `{ screen, chat, go, openChat, closeChat }`.

---

## AI model — Gemini free tier

AI SDK v6 with Gemini. Model is swappable — not hardcoded. Configuration in `lib/ai/`.
Free tier is intentional for prototype (no API cost). Swap to Claude or GPT-4 when needed.

---

## Mock data — static, no backend

All data in `lib/mock/` (threads, trips, properties). No backend, no auth, no real API calls.
Prototype validates UX, not data infrastructure. Real integration is a production concern.

---

## Chat sheet — bottom sheet, not full-screen push

`ChatSheet` slides up from bottom (spring: damping 32, stiffness 320) as an overlay over the
current screen. `top-[10px]` leaves a sliver of the underlying screen. `rounded-t-[38px]`.
The underlying screen dims with `bg-black/30` backdrop (tap to close).

**Why overlay not navigation:** The chat is ambient/contextual — it knows what screen the
guest was on when they tapped FAB. A navigation push would lose that context and break
the back-stack mental model.

---

## ThreadView — idle vs keyboard vs active modes

Three distinct layout states controlled by `inputFocused` and whether messages exist:
- **Idle** (`isEmpty && !inputFocused`): Numa wordmark centered, large Lumi orb, "Ask anything" input with microphone
- **Keyboard** (`isEmpty && inputFocused`): suggestion starters replace orb, iOS keyboard visual, send arrow
- **Active** (`!isEmpty`): standard chat UI — scrollable message list, composer at bottom

Visual iOS keyboard (`FakeKeyboard`) uses `onMouseDown + e.preventDefault()` pattern so
tapping keyboard keys doesn't steal focus from the textarea. Real keyboard still works.
