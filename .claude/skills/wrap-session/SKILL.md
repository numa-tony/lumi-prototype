---
name: wrap-session
description: End-of-session closer — summarizes what was done and rewrites docs/project/progress.md
---

# /wrap-session

Use at the end of a working session to update the project progress file.

## Steps

1. **Summarize this session.** Review the conversation and list in 2–6 bullets what was
   completed, what was attempted but left incomplete, and any decisions made.

2. **Read the current progress file:**
   ```
   docs/project/progress.md
   ```

3. **Rewrite `docs/project/progress.md`** with:
   - Updated date at the top (`Updated YYYY-MM-DD`)
   - **Done** — move newly completed items in from In Progress; keep all prior Done items
   - **In Progress** — what's actively being worked on right now
   - **Next (ordered)** — upcoming backlog, ordered by priority
   - **Deferred** — keep existing deferred items unless something was explicitly removed

   Keep it under 60 lines. Bullet points, no prose.

4. **Offer a git commit.** Ask: "Want me to commit the progress update?"
   If yes: `git add docs/project/progress.md && git commit -m "chore: update progress"`
