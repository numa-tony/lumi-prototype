<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project docs

For architecture and product decisions, read `docs/project/vision.md` before making
design or structural choices. For prior prototype tech decisions, read
`docs/project/decisions.md` before changing an established pattern.

Update `docs/project/progress.md` at the end of every working session — rewrite the
Done / In Progress / Next sections to reflect current state.

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
