# Lumi Architecture & UX Vision — Reference

> **Canonical source of truth:** the Notion doc **"Doc — Lumi Architecture & UX Vision"**
> → https://app.notion.com/p/numastays/Doc-Lumi-Architecture-UX-Vision-357a39b9f20480769deaca9797dabc1b
>
> This file is a **local mirror** of that doc, kept so agents/offline work have the vision
> without live Notion access. When the two disagree, **Notion wins** — refresh this mirror
> from Notion (via the Notion MCP) rather than editing the vision here by hand.
>
> _Sync status:_ ⚠️ Not yet live-synced — the current text below is the earlier distillation
> of the 46-page doc (CAI T2 2026 grilling session). Pending Notion MCP access to the
> numastays workspace (see docs note), after which this will be replaced with the live content.

---

## §1 The problem and opportunity

Lumi today = reactive WhatsApp chatbot. Guest messages, Lumi replies, conversation ends.
CAI T2 theme ("Agentic Experience") asks: what should Lumi become across every guest touchpoint?

Numa's edge: proprietary data on how guests actually behave — when they book, how they
communicate, what delights/disappoints. Feed that into AI and you stop reacting and start
anticipating. Goal: Lumi delivers intelligence wherever the guest already is (WA, email, SMS,
push, in-app) as a timely, personal nudge — not a blast.

MVP channels: **WhatsApp** and **in-app chat**. Architecture is built so others plug in
without a rebuild.

---

## §2 What Lumi is — two layers, two horizons

**Layer 1 — Prediction engine (long-term thesis):**
Nobody else has Numa's data. Anticipate guest needs; intervene through whichever channel fits.
This is what turns Lumi from a talker into a doer. NOT in MVP scope but all architecture
decisions leave room for it to plug in cleanly.

**Layer 2 — Unified messaging surface (T2 deliverable):**
JTBD: "Fix it without leaving." Guest mid-stay with an issue wants to resolve it in-app with a
record — not switch to WhatsApp and wonder if anyone saw it. The messaging surface is
Lumi's memory: every thread regardless of channel, presented as two views — FAB and Inbox.

Why this shape: defensible thesis + concrete shippable deliverable + forward compatibility.

---

## §3 What the messaging surface contains

**Lives here:**
- Conversational threads with Lumi (Q&A, service requests) — guest-initiated via FAB or WA
- Support thread consolidation — existing Support page absorbed into inbox
- Bartek's inbox concept — all Lumi threads, sorted by recency, active pinned

**MVP scope only (not predictive nudges yet):**
- Predictive nudges are forward-compatible but not T2
- Transactional messages (room-ready, welcome, OCI reminders) continue via existing channels;
  a read-only mirror of each appears in the inbox

**Also in inbox:**
- GX manual broadcasts — one-way announcements (parking closed, elevator serviced)
  displayed as non-conversational notice cards with no reply affordance

---

## §4 Two needs, one product

1. **Initiating from anywhere** — FAB follows guest across every screen; no navigation needed
2. **Viewing past conversations** — Inbox as the unified thread list

Decision: **one product, two views over the same data.**
- FAB = entry point (compose / new thread)
- Inbox = list view (all threads, active pinned, recency sorted, past trips collapsed)
- Same data model as Apple Mail / iMessage / Linear — not two separate products

**Why FAB not a nav tab:** FAB is persistent without claiming a permanent tab slot. It adapts
to context — different default prompts per screen (Explore vs My Trips vs property page).

**Web:** Not MVP. Same FAB-as-entry-point pattern carries to web corner launcher, no
re-architecture needed when web ships.

---

## §5 Where the inbox lives

Nav tabs currently: Explore | My Trips | Support | Profile | (Extras)

Decision: **replace Support tab with Messages tab.** Tab substitution, not addition.
Support (WA link, email link, FAQ links) → unified messaging surface.

---

## §6 Cross-channel thread model

WhatsApp = structurally one conversation. App inbox = multiple parallel threads.

**Decision: linear stream with topic tags.**
- Threads live in Lumi's memory
- WA renders them as one chronological stream with topic markers (emoji + 2 words max)
- App renders them as multi-thread inbox

**One WA topic = one app thread.** Classifier splits WA stream into threads. If confidence is
high → appended to existing thread. If uncertain → one clarifying question, never a chain.

**Asymmetry (deliberate):**
- App pulls from WA: WA messages appear in app inbox ✓
- App does NOT push to WA: app activity stays in-app, WA stays silent
  - Exception: Lumi-initiated outbound (predictive nudge, status update) may fire to WA
    based on message type and guest preferences
- Reason: volume protection + WA cost avoidance (paid per message outside 24h window)

---

## §7 Sarah's day (the canonical walkthrough)

Sarah at Berlin Novela. Illustrates:
- Multi-topic WhatsApp → multi-thread inbox (Towels #001, AC #002)
- Active service requests pinned at top
- Thread state changes (open → resolved) reflected in inbox and WA
- iOS Live Activity as projection of open thread state (not a separate notification)
- App FAB conversation stays in-app (Ramen thread never touches WA)
- Cross-context: late checkout push notification opens a thread in inbox
- Prospective thread (Barcelona browsing) tagged trip:NONE, auto-archives after 30 days

Key principles: Lumi always operates from memory regardless of channel. App is the
complete record; WA is partial but not broken.

---

## §8 Rich widgets

Widgets convert conversation into glanceable, actionable cards. "Doer not talker."

**6 categories:**
1. **Info display** — Reservation card, Property card, Room card, Booking summary card
2. **Selection** — Carousel (swipeable), List widget (vertical, scannable)
3. **Action** — Quick reply / decision widget (3–5 options + "Something else" always last)
4. **Status/state** — In-thread status widget (pinned, auto-collapses on resolve),
   Service request progress (Submitted→Acknowledged→Assigned→In progress→Resolved),
   Lock screen widget (iOS Live Activity, tap to deep-link to thread)
5. **Spatial/contextual** — Map widget (POIs personalized), Location pin
6. **Media** — Video card (how-to, embedded player), Image card

**MVP set (ships T2):** Reservation card · List widget · Quick reply · In-thread status (basic)

**Forward-compatible (designed for, not T2):** Property card, Room card, Carousel, Shopping
widget, Form widget, Service request progress widget, Lock screen widget, Map widget,
Video card, Image card

**Deliberately not widgets:** Calendar pickers, file uploaders, payment forms, login forms,
marketing campaigns.

---

## §9 Voice

**Phone channel Lumi Voice: T2 delivery.** Guest calls Numa number → Lumi voice agent
(routes through Front, same as WA). Call summary stored in inbox (not raw transcript).

**In-app voice: Phase 2 (later).** Cognigy Click-to-Call WebRTC — alternative input mode
alongside typing and chip-tapping. Voice is multimodal: say "show me alternatives" →
carousel renders.

Voice is NOT a third channel — it's an input/output mode for the app channel.
Voice activity stays in-app (same asymmetry as §6). Voice threads in Lumi's memory
same as text threads (same topic marker, state, metadata).

---

## §10 Service request lifecycle

**Two thread families:**
- **Stateful threads** — carry ops state machine, integrate with Shine task system
- **Stateless threads** — Q&A, browsing, recommendations. Auto-archive after 30 days.

Lumi's classifier decides on creation: ops needed or just conversation?

**State model for stateful threads:**
1. Open — submitted, Lumi acknowledged, ops task created
2. In progress — ops accepted, work begun
3. Awaiting guest — Lumi/ops needs more info
4. Resolved — ops marked complete
5. Closed — guest acknowledged or auto-closed 24h post-resolution
6. Escalated to human — routed to GX agent via Spark

**Auxiliary rules:**
- Closed + new message within 7 days → reopen thread
- Closed + new message after 7 days → new thread linked to closed one
- Multi-request message → split into two threads with linked metadata
- SLA: Lumi shows ETAs where ops provides them; soft windows otherwise; never overpromises
- Task scheduling currently "today/tomorrow" granularity — Lumi must NOT promise fine-grained ETAs

**Two unresolved decisions (owners: Tomas + Bartek):**
- State ownership: Model α (Lumi's memory owns state) vs Model β (Shine owns state, Lumi mirrors)
  — Tony's preference is Model β
- Routing model: auto-route by category+property, low-confidence → human via Spark

---

## §11–12 Open questions

**Brand voice & identity (Vinni Amaro + Hyona Yang):**
Identity disclosure, voice register, first-interaction message, topic marker style guide,
emoji policy, multilingual handling, error states, "What Lumi won't say" list.

**Operational architecture (Tomas Pinjusic + Bartek Bialecki):**
Master list of service request thread types, state ownership model, routing model,
SLA exposure rules, confidence threshold (suggested 0.85).

---

## §13–14 Deferred and next steps

**Deferred from this doc:** Lock screen widgets, custom Lumi iconography, multi-thread
linking, Schumeng CRM integration, MCP write capabilities, Spark unification,
predictive nudges, booking-flow Lumi.

**Next step:** This doc becomes input to the PRD. PRD will resolve §12 open questions,
commit to MVP scope with explicit T2/T3 cuts, define success metrics, document dependencies.

Stakeholders: Tomas Pinjusic, Pim, Hyeona Yang, Vinni Amaro, Bartek Bialecki,
Shumeng, Vedran.
