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

Prefer measuring over eyeballing: read `getBoundingClientRect()` and
`getComputedStyle()` to check a spacing or colour claim, and remember the phone
screen is 368×822 CSS px inside the bezel.

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
