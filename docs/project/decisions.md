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

---

## Story Mode — a registry, not a second engine

`STORIES` in `lib/demo/stories.ts` keyed by `demo.storyId`. Adding a story is a
beats file plus a registry entry; the runner, stage and store are shared.

**Sarah's Day is frozen.** Its `STORY` array in `lib/demo/story.ts` is what the
presenter rehearsed. Shared *visual* upgrades (widgets, screens, chat styling)
are expected to flow into it — its **beats** are not to change. When touching the
engine, diff that array to prove it's byte-identical:

```bash
git show HEAD:lib/demo/story.ts | sed -n '/^export const STORY/,$p' > /tmp/a
sed -n '/^export const STORY/,$p' lib/demo/story.ts > /tmp/b && diff /tmp/a /tmp/b
```

`applyStep` has an exhaustiveness guard (`const never: never = step`), so a new
Step kind without a handler is a compile error rather than a step that silently
does nothing on stage.

`snapToBeat` cancels any beat still playing before it replays. Without that,
pressing `←` mid-beat let the old beat's remaining steps land on top of the snap.

## Story surfaces use CSS, not Framer Motion

The WhatsApp / iOS home / lock surfaces, the Dynamic Island morph and the
send-button swap are plain CSS (keyframes or transitions), even though the rest
of the app uses Framer Motion.

**Why:** Framer's springs are rAF-driven, and browsers stop rAF in a background
tab. A surface that fails to appear because the presenter alt-tabbed is a broken
demo. CSS transitions have the same limitation *in flight*, but they resolve to
a correct resting state — and anything whose visibility depends on an animation
finishing is a liability on stage.

Corollary: don't add a transition to a **state** change (the mic → send swap had
one; it left the button a state behind when the clock froze).

## No backdrop-filter inside the phone frame

The Figma composer specifies `backdrop-blur-[2px]`. It is deliberately **not**
implemented. A backdrop-filter region samples everything painted behind it —
including the black bezel outside the phone's rounded clip — then gets clipped,
smearing grey into the bottom corners with a visible seam at the filter's edge.
The composer sits on the sheet's opaque white and has nothing to blur anyway.

## Island and widget geometry as percentages

Figma artboards are 402×874; the phone's screen is 368×822. Sizes for the
Dynamic Island and Live Activity are expressed as **percentages of the artboard**
so they track the frame at any render size, rather than px tuned to one width.
An early pass scaled from 402 instead of 368 and everything sat ~9% too large.

The expanded island is 91% of the screen width, so its open spring overshoots
mostly in **height** (~8%); more than ~1% on width clips the display's rounded
corners. Closing doesn't bounce — iOS doesn't bounce a Live Activity shut.

## Per-story app data

`useStay()` (`lib/demo/stay.ts`) gives Explore / My Trips / Trip Detail / Your
room the running story's stay. All-Hands shows Berlin Friedrichshain, Jul 9–12,
and hides the trip card entirely on the train home; everything else — including
Sarah's Day — sees the default mock. Stories declare `initialSurface` so the
first painted frame is right, with no flash of the app before beat 0 runs.

`STORIES.allhands.scenes = false` keeps that story on a black stage. The beats
still drive `smartRoom` through `scene` steps, so switching the flag to `true`
lights the room up behind the phone with no change to the script.

## Figma assets: export at 3x via download_figma_images

`get_screenshot` renders at the node's **natural size** and ignores
`maxDimension` above it — it cannot produce a higher-resolution export.
`mcp__figma-developer-mcp__download_figma_images` with `pngScale: 3` can, and
writes into the repo. Committed assets live in `public/allhands/`.

Icons come from Figma exports, never hand-drawn SVG — a hand-drawn mic and
technician both turned out to be visibly the wrong glyph.

## Dev-only tooling

- `window.__lumi` — the Zustand store, exposed in development only
  (`lib/store.ts`). Drive the demo from the console: `__lumi.getState().setBeatIndex(n)`.
- **Agentation** (`components/dev/Annotations.tsx`, mounted in `app/layout.tsx`) —
  click an element in the running app and leave a note that reaches the agent with
  the selector attached. Guarded on `NODE_ENV` so it can never appear over the
  Vercel demo. Needs `npx agentation-mcp server` (HTTP :4747) alongside `npm run dev`;
  `npx agentation-mcp doctor` checks both ends. In the toolbar, **Send Annotations**
  posts to the agent — **Copy** only fills the clipboard.

## Trip Detail is a literal port of Figma 7256-13081

The screen was rebuilt to the Figma frame pixel for pixel (2026-09-09), so the
numbers in `TripDetailScreen.tsx` are Figma's, not invented: hero 570px tall,
title block 335px off the hero's bottom, photos overhanging both edges by 27px,
booking card top at y=432 (hence `-mt-[146px]` on the content that follows).
Change them only against the frame.

Two things there are worth knowing before you "fix" them:

- **The card's notches are a mask, not an image.** Figma draws the ticket fold
  as a `Subtract` shape with a semicircular bite in each edge. Stretching that
  export to our narrower card (320 vs 345) would squash the circles, so the
  33px strip is masked with two `radial-gradient` circles instead. The
  drop-shadow lives on the card's *wrapper*, which is what makes the shadow
  wrap into the notches the way Figma's filter does.
- **The red glyphs are masked, not recoloured exports.** Back arrow and address
  chevron ship from Figma with `city/berlin` (#ea2720) baked in; they are drawn
  as `mask-image` over the running stay's city colour so Amsterdam still reads
  pink. Same trick as the trip-card badge arrow.

The frame has no **Room controls** row — only *Your room* and *Manage your
booking*. It was briefly moved to Your room; that frame (7256-4436) has no such
row either, so it's gone. **`roomControls` now has no entry point** other than
the story's `go` steps — put it back somewhere deliberate before anyone needs
to reach it by tapping.

## The trip card's badge is the CTA

Figma 7256-11647 puts a neutral outline Badge ("Access now →") at the top of
the trip card and has no second link underneath. The old duplicate underlined
row is gone from Explore; My Trips already matched.

## The TWK Lausanne files were the wrong cuts

Everything read thicker than Figma because the woff2s in `public/fonts/` were
mislabelled (found 2026-09-09):

| Served as | Actually was |
|---|---|
| `TWKLausanne-600.woff2` @ weight 600 | **TWK Lausanne 700 Bold** (`usWeightClass=700`, subfamily "Bold") |
| `TWKLausanne-300.woff2` @ weight 300 | **TWK Lausanne 350** (`usWeightClass=350`) |

So every heading and label rendered one full step heavier than the Figma
frames, and body copy half a step. Stem width at 2048 upm: 301 → 275 for the
semibold, 208 → 194 for the light. The italics were always correct.

While fixing it, every weight outside the two that exist was snapped back:
`font-medium` (500) was silently resolving *down* to 300 and `font-bold` (700)
*down* to 600, so a dozen labels — bottom-nav tabs, the Messages "Resolved"
chip, widget meta lines, the story-stage chrome — rendered at a weight nobody
picked. They're all `font-light` or `font-semibold` now, and `font-synthesis:
none` on the body stops the browser faking a face we haven't shipped. **Use
`font-light` or `font-semibold`; nothing else.**

Replaced with the cuts from `numa-web.ds-adoption/packages/library/public/fonts/lausanne`
— the design system's own files, which is what the Figma library is set in.
**Take font files from there**, not from a branding repo or a designer hand-off;
`numa-lumi-branding-v2` also ships correct 300/400/500/600 if the DS repo isn't
checked out. Verify a swap with `fontTools`: `TTFont(f)['OS/2'].usWeightClass`
must equal the weight you serve it at.

## Your room is a literal port of Figma 7256-4436

Hero 323px with the scrim Figma actually specifies (transparent to
`rgba(0,0,0,0.44)` between 52.5% and 70.6%, not a plain bottom fade), the title
at 36/1.1/-0.5 in `brand/numa-pink`, and the carousel dots as the exported
4-3-2px asset rather than four equal circles.

**The dots sit top-right, not by the title.** Figma parks them on the title's
baseline, which works at 393px where the second line is just "Kitchenette". At
368 the line is "with Kitchenette" and it crowds them, so they moved up onto
the toolbar's centre line (y=78), inset 20px to mirror the back button. A
deliberate deviation, asked for on 2026-09-09. Section blocks sit 24px apart at
y=339 / 591 / 962 — those come from the frame, as does the 56px "Your room"
header (Figma has an empty 40px button in it that nobody sees but that sets the
height) and the 47px "Room amenities" one (its button is hidden, so it doesn't).

The fact rows are the DS list item with its Right Addon switched off — no
chevron, no divider, 40px tall, 4px apart. That's why `ListItem` grew a
`chevron` prop.

**Known mismatch: the phone is 368px wide, the artboards are 393.** Every
measurement here is Figma's own, so anything that depends on available width
lands differently — the hero title breaks after "Medium Studio" instead of
"Medium Studio with". Making `PhoneFrame` a 393-wide screen would make this and
every other ported screen land exactly; it hasn't been done because it moves
every screen at once.

## A scripted tap has to be visible

`tapReply` used to push the reply straight into the thread, so on stage the
bubble appeared out of nowhere and nobody saw Sarah choose. It now holds the
matching chip pressed for **380ms** first — `demo.storyChat.tappedReply` names
the option, `QuickReply` renders it at `scale-[0.97]` on `#ececea` with a
`#c9c6c2` border, and `pushStoryUserMsg` releases it as the bubble lands.

Two things to keep in mind if you touch this:

- **The step's `text` must match an option string exactly**, emoji included, or
  nothing highlights and the beat just pauses. All five `tapReply` sites match
  today.
- **Cancellation follows the `userMsg` contract**: cancelled mid-press releases
  the chip and returns *without* pushing, because fast-forward re-applies the
  step un-animated and owns the push. Pushing in both places is how messages
  used to land twice.

The Ask Lumi starters are tapped the same way in All-Hands T16 ("She taps the
third one"), so they dim to 45% under the same flag.

## The map's walk shares a coordinate system with its pins

`MapWidget` drew the dotted walk in a fixed `viewBox="0 0 361 300"` while the
rating pill and the "N" pin were placed in percentages. Those two systems only
agree at one particular width, so everywhere else the dots floated free of both
markers.

Now everything is in percentages of the widget box: the SVG shares that system
via `preserveAspectRatio="none"`, and `vector-effect="non-scaling-stroke"` keeps
the dots round and evenly spaced despite the non-uniform scale. `WALK.from` /
`WALK.to` are the single source of truth — the pill is anchored by its **right**
edge to `WALK.from` (so the rating string's length can't move it) and the pin is
centred on `WALK.to`.

The path runs all the way **to the pin's centre**, not to its edge. Backing off
by a percentage radius re-opened a hairline gap on wide boxes, because the pin
is a fixed 44px. The SVG is drawn before both markers, so the opaque pin covers
the tail. Verified connected from 240px to 520px wide.

## Chat spacing comes from Figma 7229-13293

The story thread's rhythm is measured off the checkout response frame, not
eyeballed. On its 402-wide artboard: content inset **24**, first message **68px**
into the sheet, guest bubble **48** tall (16/24 text, 12px padding), **32** after
her turn, **24** between Lumi's messages, **24** between a message's text and its
widget, **12** between quick-reply buttons.

In code that is `px-6` + `pt-[52px]` on the message list (52 + the grabber's 17
lands the first message at 69), `space-y-6` both between messages and between a
message's parts, and `!mt-8` on an assistant message that directly follows a
user one — the only asymmetry in the scale, and it is deliberate: her turn gets
more room before Lumi answers.

The live `ThreadView` still has its own tighter spacing; carrying this across is
the open "ThreadView parity" item.


---

## The Lumi cube: vendored from branding-v2, not lifted

**2026-09-09.** The chat's start screen moves from the torus on a flat sheet to
the glass cube on its own lit field (Figma 7274-12724).

**There was nothing to lift.** The cube and its background are not assets —
they're ~2,900 lines of react-three-fiber and custom GLSL in
`numa-lumi-branding-v2`, whose `public/` holds a favicon, an icon sprite and
four fonts. No PNG of the cube, no video, no `.glb`. The 159 MB `shots/`
directory is development screenshots.

They are also **coupled**: `air.ts` mirrors the background's GLSL band field on
the CPU so a passing band brightens the cube's bevel, and the cube writes its
silhouette back so the background can cut a shadow. One shared light drives the
beams, the bevel, the shadow and the floor pool. Take one without the other and
neither looks right.

### Vendored + a sync script, because upstream stays alive

branding-v2 is where the cube's look keeps being explored, so the port has to be
re-pullable. `components/lumi3d/vendor/` is written verbatim by
`scripts/sync-lumi3d.mjs` and never hand-edited; overrides and two mechanical
Vite→Next codemods are applied by the script; `vendor/UPSTREAM.json` records the
commit. A codemod that stops matching fails the sync loudly.

A `file:` dependency, a path alias to the sibling, or a submodule were all
rejected for the same reason: **Vercel builds from `numa-tony/lumi-prototype`,
where the sibling repo does not exist.**

Two things deliberately did not come across:

- **DialKit** (7.5 MB, localStorage-backed). Its defaults live in the `DIALS`
  object upstream calls "the single source of truth", so the override reads
  those and stops. Two live panels editing one shader is how the repos drift.
- **`inputs.ts`**, upstream's input layer. It calls `setPointerCapture` on
  pointerdown, which inside a bottom sheet swallows taps meant for the starters
  and composer — and a draggable cube fights both the sheet's dismiss gesture
  and the thread's scroll. `useAmbientInputs` keeps the ambient parallax that
  aims the light, and leaves drag permanently at rest.

`three` is pinned to `0.185.1`: the cube's `STREAK_INJECT` splices into three's
internal shader chunk names, which are not API-stable.

### Lint had to be told to stand down at the r3f seam

A frame loop's whole job is to mutate holders sixty times a second without
re-rendering. `react-hooks/immutability` and `react-hooks/refs` reject that
outright. `vendor/**` is ignored entirely (unactionable by construction — it is
never edited here), and the two rules are off for `components/lumi3d/*` only.

### The preview pane cannot render this screen

Beyond the known "rAF stops when hidden" trap: r3f needs a frame even to *size*
its canvas, so the renderer never initialises there and you get a flat
`#f7f3f0` rectangle — indistinguishable from a broken scene. `onCreated` is
where the dev handle is published, because with no frames r3f never commits the
scene's children and an in-scene effect would never run.

`scripts/shoot-lab.mjs` (headless Chromium, SwiftShader) is how this screen gets
looked at, and it asserts the renderer's draw-call count rather than trusting
the picture. It is also the beginning of the bake pipeline: the story ships
pre-rendered frames, captured from `/lab` at the prototype's real geometry —
bake upstream and you are re-cropping someone else's composition.

### Cost, and where it is paid

three + drei is ~400 KB gzipped, roughly the size of everything else in the app.
The scene is a lazy client-only chunk, and once the background has washed fully
to white the canvas **unmounts** — so a scrolling thread costs no rAF, no 1024²
refraction buffer, and no shader drawn twice a frame.

### Measuring against 7274-12724

The cube's pose is measured, not eyeballed: at `scale 0.7, offsetY 0.95` it
matches the frame within 0.3% on width, top and bottom. Two traps in that
frame — the greeting's `top-407` is already sheet-relative while the starters'
`top-670` is frame-relative (→ 598), and the cube in the frame is a pasted
screenshot whose node bbox is much larger than the cube, so the pixels have to
be measured rather than the node.

---

## All-Hands on a photographic stage

**2026-09-10.** All-Hands now plays in front of five photographs — the Berlin
room on Friday night, Saturday with the blinds closed and open, Sunday, and the
train home — instead of a black stage. How to drive it is in `story-mode.md`
(*The photographic stage*); the tap list is in `all-hands-story.md`.

### A new layer, not the illustrated room switched back on

The obvious move was flipping `STORIES.allhands.scenes` to `true`. It would not
have worked: `SmartRoomScene` only renders behind a `breakout` gate All-Hands
never opens, so the room would have appeared at the lights-on beat and vanished
again, and both mornings would never have shown. More to the point, the brief
changed from an illustrated room to photographs. `PhotoStage` is its own layer,
mounted only for stories that declare `stage: "photos"`, so Sarah's Day is
untouched — verified headless: no stage mounted, phone in the same place.

### Two axes: which photo, and who owns the stage

`backdrop` changes the photo; `focus` hands the stage to the room (`scene` — the
phone leaves the frame) or the phone (`phone` — the room sinks behind a scrim and
a blur). They are independent, so the morning can arrive behind the phone, or the
phone can leave without the room changing. `glance` lifts the scrim while the
room itself changes; `pulse` is a one-shot accent.

Decided with Tony: when a new place or time arrives the phone goes **fully
off-stage**, the introduction gets **its own press** (four extra presses), and a small
**time-and-place stamp** names it — without it, Saturday and Sunday are both just
"morning in the same room".

### Transitions for anything interruptible; keyframes only for entrances

Framer was already ruled out on the stage (rAF stops in background tabs). The
further rule here: a presenter pressing → mid-rise must not make the phone jump.
A CSS transition retargets from wherever it is; a keyframe restarts. So focus,
scrim, glance, lights and the phone are all transitions, and keyframes are kept
for one-shot entrances (a photo arriving, a pulse). That is also why the phone's
rise has no overshoot — a bounce would break under rapid input. The premium feel
comes from choreography instead: the scrim leads the phone by 120ms, the photo
scales up 4 % as it blurs (a lens refocusing, which also hides the blur's edge
fringe), the rim light lands last.

### The scrim is solved per photo — against what's actually seen

The photos span a 4× range of brightness, so one scrim would leave the phone on
a different darkness in every room. `scripts/stage-photos.mjs` solves each
photo's alpha to land on one target luminance, tinted with that photo's shadow
colour. The first cut solved against the *whole-photo* mean and the train came
out 17 % darker than the rooms: its bright sky is cropped off-screen on a 16:9
display and never sits beside the phone. It now solves against the two bands
either side of the phone, mid-height — the same bands the headless check
measures.

### A new place starts arriving behind the phone

The Sunday and train introductions first sank the phone, reset it off-stage,
and only then brought the new photo in — which left the *previous* room sitting
there, sharp, for about a second and a half. It read as a stray extra frame
(Tony: "go from the phone straight to here"). The new photo now starts arriving
behind the phone while it's still up and the room is blurred, and the phone's
exit reveals it. Saturday is the exception on purpose: that one passes through
black, because a night is going by.

The order alone wasn't enough for Sunday. Its dissolve faded on an ease-in-out,
which has barely started half a second in — exactly when the phone's exit makes
the room readable — so Saturday still showed through for a moment. The dissolve
now front-loads its fade (expo out, as the train's travel already did), and the
check is measured, not eyeballed: at the frame the room becomes readable, the
new photo must already be most of the way in.

### Snapping stays instant

`snapToBeat` sets `stage.instant` for its replay: every stage transition is off,
and anything that *mounts* during a snap reads that flag once and never plays its
entrance afterwards (otherwise the entrance would start the moment the flag
cleared). Checked headless: after `←`, no stage transition is running, and the
state matches what forward play reached.

### Photos are two slots, not five mounted

The entering photo is keyed by the backdrop's `seq`, so its entrance always
starts from the beginning — even re-entering the same photo for a time-skip.
The outgoing one is keyed by `prevSeq`, so React keeps its DOM node as it moves
underneath and it never re-decodes. Decoded memory stays at two photos.

### Two layout bugs the stage exposed

- **The phone sat 105px right of centre in story mode.** The side panel fades
  out but kept its 210px in the flow. Photo stories take it out of the flow;
  Sarah's Day keeps its layout.
- **The page scrolled to chase the off-stage phone.** Translated below the frame,
  the phone extended the page's scrollable area, and the chat's `scrollIntoView`
  on a new message scrolled the whole window after it — dragging the invisible
  phone back up and bending its next rise. The phone's parent now has
  `overflow: clip` (`hidden` can still be scrolled programmatically).
- **The chat sheet painted over the home and lock screens.** The phone
  surfaces (WhatsApp, iOS home, lock) were `z-[45]`; the chat sheet is `z-50`
  in the same stacking context. The inbox beat had been quietly closing the
  sheet so the home screen could be seen — dropping it (Tony: go straight from
  the chat to the home screen) exposed the sheet sitting on top. The surfaces
  are now `z-[55]`: they are what the phone shows *instead of* the app, so the
  app stays alive underneath, and returning from the lock screen lands straight
  back in the chat. The island and lock activity live inside the surfaces, so
  they moved with them. It also makes T3 do what its comment always claimed —
  the chat opens hidden under WhatsApp and is revealed already open.

### Friday's lights: faked now, real later

The Friday photo has its lamps lit, but the story starts with them off. For now
the dark is an overlay shaped to the room — deeper over the lamps (anchors
measured by the asset script). Dropping a real lights-off render in as `1b-…` and re-running
`npm run stage:photos` switches it to a crossfade between two photographs with no
code change.

The opening frame is exempt: it shows the photo as photographed, with no veil
on the first image the audience sees (Tony's call). The dark takes over from the
first phone press. It is keyed to the *beat* rather than to focus alone — keyed
to focus, the room would relight for a second as the phone leaves for Saturday,
straight after "Lights off".

Behind the phone, the overlay and the phone-focus scrim used to stack: the scrim
is solved for the lit photo, so Friday with its lights off sat at about half the
other rooms' brightness — the room all but gone (Tony: "turn the strength down").
The stage now re-solves the scrim for the room as it looks with the lights off,
aimed at 0.85 of where the lit rooms land: night, but the room still there.

Lights on is a state, not a moment. It first played as a glance — the scrim
lifted for ~2s and fell back — so the room darkened again while the lights were
still "on". Now, with Friday's lights on, the scrim stays at the glance's level
(`LIGHTS_ON_LIFT`) until she turns them off (Tony: "keep it on"). Both lights
beats dropped their glances: on lights-off, a glance would flash the room
brighter just before dimming it.

A thermostat accent — a blue ring pulsing on the WhatsApp send — was cut: on
stage it read as a glitch on the edge of the frame rather than the room
answering her. The overlay's hole over the thermostat went with it; behind a
lighter scrim it would have been a blurred blue blob in the same spot.

### The stamp sits on frosted glass

The time-and-place line is on a dark, translucent, blurred card (backdrop blur
plus a faint corner sheen and a hairline top edge) rather than over a soft
corner shade. It reads on every photo without darkening the room around it. On
the bright bedspread of the opening frame the glass comes out warm brown rather
than charcoal — the room showing through, which is the point of glass.

### Assets

`sharp`, already shipped with Next, turns the 18 MB of 2880px JPEGs into AVIF at
1920 and 2560 (38–183 KB each), plus a WebP fallback and a blurred placeholder
per photo, and writes a manifest with each photo's scrim, rim colour and
measured anchors. Nothing is tuned by hand.

### Turbopack doesn't hot-reload `globals.css`

Found while building this: TSX edits reload, `app/globals.css` edits don't, and
the stale compile survives a restart in `.next/dev`. It cost real time because
the symptom is silence — no error, the rules just aren't there, and the first
round of headless "passes" were measuring a scrim stuck at full opacity. Fix and
check are in AGENTS.md *Working notes*.

## The Lumi knot in the story chat, from branding v7

**2026-09-14.** The story chat's static `/lumi-torus.png` becomes the live
holographic torus knot from `numa-lumi-branding` (v5–v9 there; v7 is the chat
flow). It behaves like v7: idle on the start screen, and on her message it glides
(600ms, `cubic-bezier(.2,.8,.2,1)`) down to 36px where Lumi's answer will land,
spinning in its `thinking` state. It fades out (200ms) when the answer arrives,
and on the next question it reappears in place, already thinking. **The typing
dots are gone:** the knot *is* the loading state, in both stories. Sarah's Day's
beats are untouched; only the rendering changed.

### Vendored like the cube, with teardown added by codemod

Same reasoning as the cube: upstream is still being explored, and Vercel can't
see a sibling repo. So `scripts/sync-lumi-knot.mjs` (`npm run sync:knot`, with a
`check:knot` that fails on drift) copies `lumi-knot.js`,
`lumi-knot-states.js` and `lumi-knot-morph.js` into
`components/lumi-knot/vendor/`, and `assets/matcap-holo.png` to
`public/lumi-knot/`. `UPSTREAM.json` records the commit. None of the dials,
alternative shapes or materials come across: `createKnot()` with no extras is
v7's default look, the holo matcap.

**Upstream is not edited, so four codemods do the work.** `createKnot()` runs
its frame loop forever and has no `dispose()`. That's fine for a page that owns
one knot for life. Here the chat sheet mounts it on every open, close and `←`
snap, and each mount would leak a WebGL context until the browser starts killing
the oldest one. The codemods do three things:

- point the matcap at `/public`;
- keep the rAF id and stop the loop once disposed;
- add a `dispose()` that frees every GPU resource and removes the canvas.

Each codemod must match exactly once, or the sync throws. If upstream ever grows
its own `dispose()`, delete codemods 2–4.

The knot overrides three of three.js's internal shader chunks (`beginnormal_vertex`,
`begin_vertex`, `opaque_fragment`). Upstream runs r180 and we run the pinned 0.185.1,
and all three chunks were checked present there. Bumping `three` means checking again.
The knot warns in the console if `opaque_fragment` goes missing.

### One knot, one overlay, empty anchors in the layout

The knot moves from the start screen into the thread, and those are two
different React branches. So the knot can't live inside either:

- `StoryThreadView` holds one overlay above both branches.
- The layout holds only empty anchors: 227px on the start screen, and 36px where
  the answer will land.
- `useKnotPlacement` transforms the overlay onto whichever anchor the mode names.
  This is v7's `placeKnot`: one canvas, scaled with CSS.

The move is measured against the chat's own root, so it holds while the sheet
slides, and any ancestor scale is divided out. Three things improve on v7:

- **It follows the anchor every frame.** v7 doesn't track scroll, but the story
  list `scrollIntoView`s smoothly on every message. While it's showing, a rAF loop
  re-places the knot. Outside a glide the transform has no transition, so it
  tracks exactly.
- **It's clipped to the message list,** so a scroll can't carry it over the
  composer or under the pinned request.
- **Only a live message counts as "waiting".** Her turn counts only if it was
  pushed live (`story_u_…`). A seeded thread that ends on her message isn't
  waiting for anything. Checking the last message's role at all covers the
  instant between her message landing and `lumiTyping`, so the knot never
  flickers out mid-glide.

`←` snaps (`demo.stage.instant`), reduced motion and the first mount place the
knot instantly.

### Verifying it

The preview pane never draws the knot, because rAF is stopped there.
`scripts/shoot-story.mjs` now checks it headless:

- At rest, the start-screen knot sits on its anchor within ±2px, and its pixels
  aren't flat, so it's really drawn.
- It's never left thinking, and it's faded out once Lumi has answered.
- It glides from the start screen and appears in place otherwise.
- There's never more than one knot canvas.
- Any WebGL warning in the console fails the run.
- `←` snaps leave it on its anchor with nothing in motion.
