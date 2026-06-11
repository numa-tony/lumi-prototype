# Story Mode — "Sarah's Day" Narrative Bible

> Planning doc for the keyboard-driven stakeholder demo (`lib/demo/story.ts`).
> This is the **narrative** source of truth. We refine the story here first, then
> the beat data + staging in code follow from it. Pixar craft, not a feature list.

Status: **REFINING v5 — second round of annotations applied 2026-06-11. Awaiting build approval.**
Still narrative-only; no code yet.

---

## 1. What this has to do (two jobs at once)

Story Mode is shown to stakeholders. It has two jobs that must not fight each other:

1. **Make them FEEL it** (the Pixar job) — by the end of 4 minutes they should
   *want* this to exist, not just understand it. Emotion is the payload.
2. **Make them BELIEVE it** (the PM job) — every emotional beat is secretly a
   proof point for a specific Lumi thesis (memory, cross-channel, proactive,
   doer). The story is an argument wearing a story's clothes.

The discipline: **never show a feature for its own sake.** If a beat doesn't move
Sarah emotionally *and* prove a thesis, it gets cut. (See §6 mapping.)

---

## 2. Who is Sarah (character first)

Pixar starts with a person, not a product. Sarah Klein is not "a user." She's:

- **Where she is:** landing in Berlin, alone, at night, in a city she doesn't know.
  Numa Berlin Novela, Kreuzberg. Room 204. (Specificity is everything — never
  "a hotel.")
- **Her WANT (external):** a frictionless trip — get in the door, fix what breaks,
  eat well, not waste her weekend on logistics.
- **Her NEED (internal):** to not feel *alone* and *transactional* in a strange
  place. To feel like someone has her back. This is the real arc — she arrives
  bracing for friction and ends feeling held.

The universal pains we're tapping (these must be instantly recognizable):
- The dread of arrival: *"how do I even get in?"*
- The thing that ruins a stay: *something breaks, and now I have to fight to fix it.*
- Being hungry/lost somewhere unfamiliar.
- The low-grade exhaustion of every hotel interaction being a transaction.

> Pixar rule we're leaning on: write what's interesting to the **audience**, not
> what's fun to demo. Relatability beats novelty. They've all been Sarah.

---

## 3. The spine (Pixar "once upon a time")

> Once there was **a traveler who landed alone in a strange city**, dreading every
> small friction of being a stranger there.
> Every day, getting what she needed meant **phone calls, front desks, waiting,
> wondering if anyone even saw her message.**
> One day, **she opened an app — and discovered it already remembered her,
> everywhere she went.**
> Because of that, **the small frictions dissolved** — a door opened, towels
> arrived unasked, a broken AC fixed itself without a single phone call.
> Because of that, **she stopped bracing for the next problem** and started to
> feel, in a city she'd never been, like someone had her back.
> Until finally, **on her last night, she spoke into the dark — and the room
> itself answered.**

That last line is the climax. Everything builds to the room knowing her.

---

## 4. The emotional arc (and why it needs a DIP)

The current draft is a montage of nice moments — all warm, all up. That's the
trap. A real arc has **texture and a low point.** The AC breaking is our Pixar
"all is lost" beat in miniature: a flash of genuine frustration so the resolution
is *earned*, not just pleasant. Without the dip, the magic at the end is cheaper.

```
emotion
  ▲
  │                                                      ✦ AWE (room responds)
  │                                              ◇ SURPRISE (Lumi reaches first)
  │                 ◇ WONDER                ◇ DELIGHT
  │   ◇ RELIEF      (it knows!)   ◇ WARMTH  (local friend)
  │   (door opens)                (unasked)        ◆ TRUST (AC fixed, recovery)
  │                                       ╲       ╱
  │                                        ╲     ╱
  │                                         ◆  ← the DIP: AC breaks. real frustration.
  └──────────────────────────────────────────────────────────────────────▶ time
     1        2          3        4(dip)  5(recover)  6        7        8
```

Beat-by-beat emotional target (v5 — 8 story beats, Memory beat removed):

| # | Beat | Emotion | The feeling we're engineering |
|---|------|---------|-------------------------------|
| 1 | Arrival → door opens | **Relief** | She's done her check-in but has no PIN. One chat, the door opens. |
| 2 | Room lights + blinds | **Delight** | Two commands, the room obeys. First physical integration taste. |
| 3 | Towels (WhatsApp) | **Warmth** | She needs towels, asks via WA. Both phones show the same thread. Cross-channel, through a practical need. |
| 4 | AC breaks | **Frustration** | Summer heat. She turns on the AC. Hot air. *(the dip)* |
| 5 | AC fixed | **Relief → Trust** | Handled, with a record, no fight. The dip recovers. |
| 6 | Ramen | **Delight** | "I'm hungry and don't know what I want." Lumi helps her decide, shows her where to go. |
| 7 | Late checkout | **Surprise** | She asks about checkout time. Lumi answers — and offers her a late checkout she didn't know to ask for. |
| 8 | The room | **Awe** | Netflix on. "Close the blinds." "Turn off the lights." Sequential, natural. The quiet earned ending. |
| — | Thesis | resolution | The argument lands. She arrived alone, leaves held. |

---

## 5. Three-act shape

- **Act 1 — Arrival & the reveal (beats 1–3).** Ordinary world: tired, done her
  check-in, standing outside a locked door with no PIN. She opens Lumi → door opens
  → room lights come on + blinds open → she needs towels, texts WA, and sees the
  same message appear in the app (cross-channel in action, through a real need).
- **Act 2 — The day, rising (beats 4–6).** Summer heat, AC breaks → AC fixed (the
  dip and recovery) → hungry with no idea what she wants, Lumi helps her decide
  (ramen, map widget). She relaxes across this act.
- **Act 3 — Quiet climax & theme (beats 7–8 + thesis).** She asks about checkout,
  Lumi answers + offers a late checkout she didn't know she wanted → Netflix on,
  blinds closed, lights off. The quiet earned ending.

---

## 6. Proof-point mapping (story ↔ thesis)

This is the table that keeps us honest. Every beat earns its place twice.

| # | Beat | Emotional job | Thesis it proves (from `vision.md`) |
|---|------|---------------|-------------------------------------|
| 1 | Arrival → door | Relief | One Lumi met where she already is (WhatsApp); Lumi as **doer** — it unlocks the actual door, no app download, no front desk. |
| 2 | Memory | Wonder | **The core thesis: Lumi is memory across channels.** WA convo → app inbox. |
| 3 | Towels | Warmth | Proactive care; thread resolved without re-asking (§7, "doer not talker"). |
| 4 | AC breaks | (sets up trust) | A stateful service thread is born — submitted, acknowledged, ops task created (§10). |
| 5 | AC fixed | Trust | "Fix it without leaving" — status widget ticks to resolved, a record, no phone call. |
| 6 | Ramen | Delight | App-only thread; WA stays silent (the §6 asymmetry); Lumi as local. |
| 7 | Late checkout | Surprise | Reactive→**anticipatory**; Lumi-initiated outbound (§2 prediction layer). |
| 8 | The room | Awe | One Lumi everywhere — voice + room control as the same memory (§9). |

> Believability note (Pixar rule #19: don't solve problems by coincidence/magic).
> The widgets are what make Lumi feel *real* instead of fairy-tale: the technician
> ETA, the status progression, the record that persists. Keep them on screen — they
> are the evidence that this is a system, not a wish.

---

## 7. Staging principles (how the screen tells it)

1. **Show, don't narrate.** Narration is a caption, not a script. One short line.
   The phones do the talking. If the screen already shows it, cut the words.
2. **The dual-phone is the money shot for memory (beat 2).** Left = the WhatsApp
   conversation she just had. Right = the app inbox, showing those *same* topics
   as threads. "It already knows everything" must be *visible*, not asserted.
3. **Pay off what you set up.** Beat 1 says "how do I get in?" — so beat 1 must
   *show Lumi getting her in* (door code arrives). Right now that payoff is missing.
4. **The AC dip is real.** Let beat 4 sit in the frustration for a moment before
   the resolution. Sarah's line should be genuinely annoyed. The relief is the
   status widget updating — calm, recorded, no fight.
5. **Progressive inbox.** Threads appear one per beat, chronologically, so the
   inbox visibly *fills with her day*. (Already built: `loadThread`.) Exception:
   beat 2 needs the arrival thread present so "it knows" has something to show.
6. **Silence at the climax.** Beat 7 narration is minimal. The room dimming +
   blinds + Netflix does the emotional work. Don't crowd it with words.
7. **Emotional variety in Sarah's voice.** She texts like a real person — lowercase,
   casual ("how do i get in lol"), an eye-roll on the AC ("ugh"), warmth by the
   end. Not marketing copy. Her register *changes* as she relaxes.

---

## 8. Beat sheet (v5 — Lavish annotations applied 2026-06-11)

Format per beat: **on screen** · **narration (caption)** · **Sarah (her voice)** ·
**proof**. Copy is a strong draft; final lines tuned during build.

**0 · Title** — "Sarah's epic day with Lumi" / 4 min / keyboard hint.
Resets state, clears threads, no scenes broken out.

**1 · Arrival → the door opens — RELIEF** · *app + FRONT-DOOR scene*
- On screen: Lumi in-app chat (Ask AI button). No pre-loaded messages. Sarah
  types "I'm standing in front of the building? how do i get in?" → Lumi:
  "I've opened the front door for you. If you want to use the pin pad, you can
  also use **39203** ✔️". **Behind the phone, the front door swings open** (new
  FrontDoorScene). Warm light spills out.
- Narration: "Friday, 7pm. She's done her check-in. No one told her the door PIN."
- Sarah: "I'm standing in front of the building? how do i get in?"
- Proof: **Lumi as doer** — opens the actual door. No front desk, no key pickup.

**2 · Room lights + blinds — DELIGHT** · *app + SmartRoomScene breakout* ← first physical magic
- On screen: **Background fades to black** — coming from the warm lit exterior of beat 1. Then she steps inside, asks "can you turn on the lights?" → **SmartRoomScene breaks out behind the phone**, lights on. Then "can you open the blinds?" → blinds roll up. Same app. Two commands.
- Narration: "The room is dark."
- Sarah: "can you turn on the lights?" → "can you open the blinds"
- Proof: one chat → physical world obeys. Sets up the beat 8 ending.

**3 · Towels — WARMTH** · *both phones* ← cross-channel reveal through a practical need
- On screen: She goes to the bathroom — not enough towels. Opens **WhatsApp**, asks
  "where can i get more towels?" → Lumi: "Essentials closet, first floor, just past
  the lift." **Both phones show the same thread** — WA left, app inbox right.
- Narration: "She goes to the bathroom. She needs more towels."
- Sarah (on WA): "where can i get more towels?"
- Proof: **cross-channel memory** — WA message appears in app inbox. Both phones. One Lumi.

**4 · AC breaks — FRUSTRATION** · *both phones* ← the dip
- On screen: AC thread opens. Status widget: "Submitted → Acknowledged → Assigned →
  technician ETA ~7 min." Already in motion.
- Narration: "With the summer heat, she turns on the AC. Hot air."
- Sarah: "ac's just blowing warm air. ugh. 😤"
- Proof: stateful service thread born; ops task created automatically.

**5 · AC fixed — RELIEF → TRUST** · *both phones* ← the recovery
- On screen: same AC thread; status widget **ticks to Resolved** —
  "AC repair complete · Maintenance · Room 204." No phone call ever happened.
- Narration: "No phone call. No front desk. Just… fixed."
- Sarah: "and it's done. i didn't have to chase anyone."
- Proof: fix-it-without-leaving; the record persists; trust earned.

**6 · Ramen — DELIGHT** · *app*
- On screen: Sarah says she's hungry but doesn't know what she wants. Lumi offers
  **multiple food options**. She picks Ramen. Map widget launches showing nearby
  highly rated ramen restaurants.
- Narration: "Hungry. She doesn't even know what she wants yet."
- Sarah: "I'm hungry and don't know what I want."
- Proof: Lumi as local — helps her decide, then shows her where to go.

**7 · Late checkout — SURPRISE** · *app + trip card widget*
- On screen: Sarah asks "what time is my checkout?" → Lumi launches **trip card
  widget** (check-in Fri, check-out Sun 11am) → Lumi offers: "Check out at 1pm
  instead of 11am for €20?" → She accepts → Lumi: "Done, we've added it to your trip."
- Narration: "Sunday morning. She asks about checkout. Lumi answers — and makes her an offer."
- Sarah: "what time is my checkout?"
- Proof: answers the question asked AND surfaces the right upgrade at the right moment.

**8 · The room — AWE** · *app → room breakout* ← the quiet earned ending
- On screen: After booking late checkout, she turns on Netflix. Then asks Lumi
  "can you close the blinds?" → blinds close. "and turn off the lights" → lights
  off. SmartRoomScene: TV glowing, room dark, blinds drawn. The end.
- Narration: "Her last night. Netflix on."
- Sarah: "can you close the blinds?" → "and turn off the lights"
- Proof: the room follows her. Sequential, natural, zero friction.

**9 · Thesis** — "Not a chatbot. / Your stay, handled." — Lumi · Numa Stays.

---

## 9. Decisions (LOCKED 2026-06-11, v5 updated)

1. **Timeline — Friday → Sunday weekend.** ✅ Update `guest.ts`. All narration Fri/Sat/Sun.
2. **Arrival — in-app chat, PIN 39203.** ✅ She's done her check-in but has no PIN.
   Opens Ask AI → Lumi opens door + gives PIN 39203. FrontDoorScene breaks out.
3. **Beat 2 — room lights + blinds.** ✅ Two commands: lights on, blinds open. SmartRoomScene.
4. **Beat 3 — Towels via WhatsApp (cross-channel).** ✅ She needs towels, asks WA.
   Both phones show the same message. Cross-channel through a practical need, not a meta reveal.
5. **AC — split into two beats (4 + 5).** ✅ Narration: "summer heat, hot air." → "fixed."
6. **Ramen — "I'm hungry, don't know what I want."** ✅ Options → picks ramen → map widget.
7. **Late checkout — she asks, Lumi offers upgrade.** ✅ She asks checkout time → trip card
   widget → Lumi offers 1pm late checkout for €20 → accepts → confirmed.
8. **Room ending — Netflix → blinds → lights off.** ✅ Sequential, natural, quiet ending.
9. **Narration — terse.** ✅ One line per beat; beat 8 near-silent.
10. **Audio — out for this pass.** ✅ Revisit later; high-leverage for a future pass.

---

## 10. Deliberately NOT in the story

- No feature tour / settings / multi-property browsing — this is Sarah's *day*, not
  a product catalog.
- No live AI in story mode — every beat is scripted and deterministic.
- No explaining the architecture on screen — the thesis card is the only "telling."
- No second persona — one character, one arc.

---

## 11. Build implications (what's net-new when we code)

Captured here so the build phase is mechanical. **Not building yet.**

**A. FrontDoorScene (new).** A scene that breaks out *behind/around the phone* for
beat 1 — parallel to the existing `SmartRoomScene` room breakout. Shows the Numa
Berlin Novela entrance, door initially shut, then **swings open** (light spills
out, welcoming) when Lumi unlocks it.
- New component `components/device/FrontDoorScene.tsx`, mounted alongside
  `SmartRoomScene` in `app/page.tsx`.
- New store flag for the breakout (e.g. `demo.doorBreakout` or generalize the
  existing `roomBreakout` into a `scene: "none" | "room" | "door"`).
- New beat action: `{ type: "frontDoor"; open: boolean }` (or fold into a generic
  `scene` action).
- **Asset — build abstractly (resolved).** No photo needed. `SmartRoomScene` is
  already pure inline-SVG + CSS + framer-motion (Eiffel silhouette, ambient glow,
  and an animated **Padlock** with locked→unlocked→open states + an existing
  `door` smartRoom slice). FrontDoorScene matches that language: an illustrated
  entrance (façade, glass door, warm interior glow) with the door swinging open.
  Reuse the padlock-unlock motion vocabulary. No asset-sourcing risk; visually
  consistent with the rest of the prototype.
- **Beat 1 → 2 transition:** when FrontDoorScene exits on beat 2, backdrop fades
  to black before SmartRoomScene appears. Dark overlay (opacity 0 → 1 → 0) gives
  the viewer a moment of darkness that makes the lights-on reveal land harder.

**B. Arrival in-app chat seed (new).** A scripted in-app chat exchange for beat 1:
Sarah "I'm standing in front of the building? how do i get in?" → Lumi "I've
opened the front door for you. If you want to use the pin pad, you can also use
39203 ✔️". Add as a new demo thread seed in `lib/mock/threads.ts`; load via
`loadThread("arrival")` on beat 1. **No WhatsApp required for this beat.**

**B2. Room lights + blinds seed (new).** A scripted exchange for beat 2: "can you
turn on the lights?" → done + "can you open the blinds?" → done. Fires `smartRoom`
(lights on + blinds open) + `breakout: true`. Beat 3 must assert `breakout: false`
so SmartRoomScene only shows on beat 2 and beat 8.

**B3. Towels WA seed (new).** A scripted WA exchange for beat 3: Sarah "where can
i get more towels?" → Lumi essentials closet response. Beat 3 fires
`setWaEnabled: true` + loads WA thread + mirrors the thread into the app inbox.
Both phones show the same message — the cross-channel money shot.

**C. AC state transition (new mechanic).** Beat 4 loads the AC thread *in-progress*;
beat 5 must flip it to *resolved* (status widget Submitted→Resolved). `loadThread`
only adds — we need either a `resolveThread(id)` action or two AC seed variants
(in-progress seed for beat 4, resolved seed for beat 5, swapped on enter).

**D. guest.ts timeline edit.** Move the stay to a Fri→Sun weekend; keep room 204,
Kreuzberg, PIN **39203**, reservation FJKD3K.

**E. story.ts beat array → 10 beats** (0 title … 9 thesis). Update `StoryStage`
beat-counter math (story beats = total − 2). Beat 2: SmartRoom breakout on.
Beat 3: breakout off. Beat 8: breakout on again (Netflix + blinds closed + lights off).

**F2. Trip card widget (beat 7).** New widget type in the thread view: shows
check-in/check-out times, with a late checkout offer card (1pm for €20), Accept/Decline
quick-reply, and a confirmation state. New thread seed `loadThread("late-checkout")`
that seeds this widget into the thread.

**F3. Ramen food options flow (beat 6).** Thread seed that shows Lumi offering
multiple food options, a selection step, and then the map widget with nearby
rated restaurants.

**F. Sequencing sanity** — story beats that toggle scenes must also toggle them
*off* when navigating backward (the director re-runs actions on every beatIndex
change, so each beat's action list must fully assert the scene state it wants,
not assume the previous beat's state).
