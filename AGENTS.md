<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project docs

`docs/project/context.md` and `docs/project/progress.md` load automatically with
`CLAUDE.md` — the map of the project and where the work is up to. Beyond those:

| Read | When |
|---|---|
| `docs/project/decisions.md` | **Before changing an established pattern.** The why behind non-obvious choices |
| `docs/project/all-hands-story.md` | Working on the All-Hands walkthrough — every tap, and how it's built |
| `docs/project/story-mode.md` | Working on the Sarah's Day engine |
| `docs/project/vision.md` | Design/structural choices — but it's a **stale** mirror; the Notion doc wins |

Update `docs/project/progress.md` at the end of every working session — rewrite the
Done / In Progress / Next sections to reflect current state. When a choice took
real thought, or you had to undo something to reach it, add it to
`docs/project/decisions.md` so the next session doesn't relitigate it.

## Working notes

**Story Mode is the deliverable most of the time.** Sarah's Day's beats are frozen;
see `decisions.md` before touching `lib/demo/`.

**Only two font weights exist.** TWK Lausanne ships here as 300 and 600 only.
Tailwind's `font-medium` and `font-bold` don't fail loudly — CSS quietly falls
back to a neighbouring face — so use `font-light` or `font-semibold` and nothing
else. `app/globals.css` carries the full note, including where to get
replacement files and how to verify them.

**Verifying in the browser preview.** The preview pane often runs hidden
(`document.hidden === true`), which stops rAF — so CSS animations, CSS
transitions and Framer Motion all freeze mid-flight. Screenshots still render.
What works:

```js
// finish CSS/WAAPI animations before screenshotting
document.getAnimations().forEach(a => { try { a.finish() } catch {} });
// Framer springs won't settle — force the chat sheet if you need to see it
const w = [...document.querySelectorAll('div')].find(d => d.className?.includes?.('inset-0') && d.className.includes('z-50'));
w.style.cssText += ';opacity:1!important;transform:none!important';
```

Timers are throttled to ~1s in a hidden tab, so a scripted beat's typewriter
crawls. Drive the story from the store instead of the keyboard:
`__lumi.getState().setBeatIndex(n)` — going *backwards* snaps instantly
(`snapToBeat`), so jump past your target then step back to it.

**Two traps that cost real time in the hidden pane:**

- **`AnimatePresence mode="wait"` never completes.** `AppShell` waits for the
  outgoing screen's exit animation, which is frozen — so `go('yourRoom')` sets
  the store but the new screen never mounts, and you sit there thinking your
  component is broken. `screen` is not persisted, so reloading won't help
  either. To actually look at a screen, temporarily drop the `mode="wait"` in
  `components/device/AppShell.tsx`, verify, then revert (check with
  `git diff`).
- **A frozen sheet measures as zero.** The chat sheet mid-spring reports a
  bounding height of 0, so any pixel distance read off it is nonsense — and
  forcing it open with inline styles distorts what you then measure. Prefer
  `getComputedStyle()` for the value you actually care about (a padding, a
  colour), or a difference that is transform-invariant, over a rect against the
  frame. If a rect looks impossible, it is.

Also: **don't `npm run build` while the dev server is running** — they share
`.next` and the dev server starts throwing module-not-found until you reload.

**`app/globals.css` edits don't hot-reload.** Turbopack (Next 16.2) picks up TSX
changes but keeps serving the CSS it compiled at startup — even across a restart,
because that compile is cached in `.next/dev`. The symptom is a CSS rule that
simply isn't there, with no error anywhere. Check by grepping the served file:

```bash
curl -s localhost:3000/_next/static/chunks/$(curl -s localhost:3000/ | grep -oE 'app_globals_[^"]+\.css' | head -1) | grep -c 'your-rule'
```

Fix: stop the dev server, `rm -rf .next/dev`, start it again.

Prefer measuring over eyeballing: read `getBoundingClientRect()` and
`getComputedStyle()` to check a spacing or colour claim, and remember the phone
screen is 368×822 CSS px inside the bezel — **the Figma artboards are 393 wide**,
so a ported measurement is right but anything width-dependent (line breaks
especially) lands differently. See `decisions.md`.

## Visual feedback (Agentation)

Point at the running app instead of describing it. Click any element, leave a
note, and it reaches the agent with the element's selector, position and nearby
text attached.

The toolbar is mounted in `app/layout.tsx` via `components/dev/Annotations.tsx`
and is **development only** — it never renders in a production build, so it
can't appear over the Vercel demo.

It needs the local sync server running alongside `npm run dev`:

```bash
npx agentation-mcp server     # HTTP on :4747 for the browser, MCP on stdio for the agent
npx agentation-mcp doctor     # checks both ends
```

Ask the agent to "watch for annotations" and it will call
`agentation_watch_annotations` in a loop: acknowledge each note, make the
change, then resolve it with a summary of what it did.
