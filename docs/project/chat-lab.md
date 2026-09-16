# The chat lab

`/lab` — a bench for the Lumi chat's design at real device size, separate from
the prototype so nothing on it can reach the demo at `/`.

It drives the **real** chat components, not copies. What you tune here is what
ships; there is no second implementation to keep in step.

## What's on it

- **States** — Idle · Typing · Docking · Thread. The cube's behaviour *across*
  these is the point: a glass cube that reads beautifully on an empty screen
  still has to survive a thread scrolling over it.
- **Cube knobs** — scale, offset x/y, and how far the background has washed to
  white. Composition only.
- **Layout knobs** — the frame's measurements (greeting, subtitle, starters,
  composer), so a ported number can be argued with.
- **Backdrop** — `Lit canvas` (7274-12724, upstream's light-through-a-curtain
  field) or `Pink → sage` (7206-14806). Both render *inside* the scene, so the
  glass refracts either one; the gradient's stops and pink lobe are tunable.
- **City accent** — Lumi takes the colour of the city she's in.
- **Frozen** — render a still instead of the live scene.

**There are deliberately no shader dials.** The cube's own look is decided in
`numa-lumi-branding-v2`; see *Keeping the cube in sync* below.

## The URL is part of the bench

`?state=docking&scale=0.7&y=0.95&fade=0.5&city=london&chrome=0`

| param | what |
|---|---|
| `state` | `idle` · `typing` · `docking` · `thread` |
| `scale` `x` `y` `fade` | the cube pose, overriding the state's defaults |
| `backdrop` | `field` · `gradient` |
| `pinkStop` `sageStop` `lobe` | gradient tuning |
| `city` | city accent id |
| `chrome=0` | scene only — no greeting, starters or composer |
| `greetingTop`, `subtitleTop`, `startersTop`, `composerFoot`, `composerGutter` | layout overrides |

`chrome=0` is how the cube gets measured against the frame without type in the
way, and how the scene layer can be baked on its own.

## Looking at it

**The in-app preview pane cannot render this screen at all.** It runs with
`document.hidden`, which stops rAF — and react-three-fiber needs a frame even
to *size* its canvas, so the renderer never initialises and you get a flat
`#f7f3f0` rectangle. That looks exactly like a broken scene and isn't one.

Use the headless capture instead, which runs a real WebGL loop (SwiftShader):

```bash
node scripts/shoot-lab.mjs --out .scratch/lab.png
node scripts/shoot-lab.mjs --state docking --sel "[data-lab-sheet]" --dpr 2
node scripts/shoot-lab.mjs --frames 6 --interval 120 --sheet   # motion check
```

It reports `health.calls` — the renderer's draw-call count. **A screenshot of a
scene that never drew is indistinguishable from a broken one, so check the
number, not the picture.** It exits non-zero if nothing was drawn.

In a real browser tab (not the preview pane) the scene runs normally, and
`window.__lumiScene.step(n)` advances it by hand in development.

## Measuring against Figma

Frame **7274-12724**. The cube's default pose is measured, not eyeballed — at
`scale 0.7, offsetY 0.95` the rendered cube matches the frame to within 0.3% on
width, top edge and bottom edge.

Two traps in that frame's coordinates:

- The **greeting and subtitle** are absolute inside the Sheet, so `top-407` is
  already sheet-relative. The **starters** are absolute in the outer 874px
  frame, so 670 needs the 72px status-bar-plus-inset subtracted → 598.
- The cube in the frame is a **pasted screenshot with transparent padding**, so
  its node's bounding box is much larger than the cube. Measure the pixels, not
  the node.

## The two backdrops

`GradientBackdrop.tsx` is **not** vendored, and deliberately so. Upstream's
background is a whole system — pleats, plaster relief, spectral caustics —
built around a canvas only ~12 sRGB levels below white. 7206-14806 wants a
saturated colour field instead, which is a different thing rather than a
setting of the same thing. Bending upstream's dials toward it would fight every
assumption that shader makes.

It sits in the scene rather than in the DOM behind the canvas, because
`MeshTransmissionMaterial` refracts what is *rendered behind it* — an in-scene
plane means the cube genuinely picks up the pink and green through the glass. A
CSS gradient behind a transparent canvas leaves the cube looking pasted on.

Two things that cost time when it was built, both worth knowing before you
write another backdrop:

- **End the fragment shader with `#include <colorspace_fragment>`.** Uniform
  colours arrive in the linear working space; without the conversion back, the
  field renders a stop darker and far more saturated than the frame. Add dither
  *after* the include, as upstream does.
- **Don't centre a backdrop plane on the world origin.** The rig looks at the
  entity, not straight ahead, so a plane at the origin leaves a wedge of the
  frustum uncovered — a hard line across the screen where the clear colour
  takes over. Park it on the camera's view axis and copy the camera's
  quaternion.

With the gradient up, the entity's `AIR.atCube` — the CPU mirror of upstream's
light-band field, written by upstream's background — holds its neutral 0.5, so
the cube keeps its glass and interior light but loses the band-driven shimmer
on its bevel. There are no bands here to shimmer with.

Colour accuracy is checked by sampling, not by eye: the field currently sits at
a mean channel error of ~5/255 against the frame.

## Keeping the cube in sync

`components/lumi3d/vendor/` is copied from `numa-lumi-branding-v2` and is
**never hand-edited**. Re-pull after exploring upstream:

```bash
npm run sync:lumi3d           # or: node scripts/sync-lumi3d.mjs ../path-to-branding-v2
npm run check:lumi3d          # fails if vendor/ has drifted
```

The script copies the files verbatim, applies two mechanical Vite→Next fixes,
overlays `components/lumi3d/overrides/`, and writes `vendor/UPSTREAM.json` with
the upstream commit — so "which cube is in the demo?" always has an answer. If
a codemod stops matching, the sync fails loudly rather than producing a
half-patched file.

**Anything you want changed about the cube, change upstream and re-sync.**
Prototype-specific concerns — how big it is, where it sits, when it docks —
live outside `vendor/`, in `CubeScene`/`CubeStage` and the chat components.

## The shape of the port

```
components/lumi3d/
  vendor/            verbatim upstream — cube, shaders, motion, air, wall, light
  overrides/lib/     the DialKit panel, replaced by a defaults-only stub
  shims/dialkit.ts   the one type the vendored code imports (tsconfig path alias)
  useAmbientInputs   parallax only — no drag, no pointer capture
  CubeScene          the Canvas, the camera rig, the composition driver
  CubeStage          lazy client-only mount, the white wash, the frozen still
```

`CubeStage` is where the cost is controlled. three + drei is ~400 KB gzipped —
about the size of everything else in the app — so the scene is a lazy,
client-only chunk, and once the background has fully washed to white the canvas
**unmounts**: no rAF, no 1024² refraction buffer, no shader drawn twice a frame.
That is what makes the cube affordable in a conversation.
