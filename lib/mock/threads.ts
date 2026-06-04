import type { UIMessage } from "ai";
import type { PersistedThread, SeedMessage, Thread } from "../types";
import { BERLIN_POIS, PROPERTIES, IMG } from "./properties";

// The seeded inbox — Sarah's day at Numa Berlin Novela (from the UX vision doc).
// Every thread is continuable: opening one shows its seeded history and lets the
// stakeholder keep chatting live with Lumi, who gets the thread `hint` as context.

const barcelona = PROPERTIES.find((p) => p.id === "barcelona-palmera")!;

export const THREADS: Thread[] = [
  {
    id: "ac",
    topic: "AC",
    emoji: "🧊",
    state: "in_progress",
    filter: "priority",
    active: true,
    unread: true,
    preview: "Technician arriving ~7 min",
    time: "11:08",
    hint: "This is an open maintenance service request. The AC in the guest's room (204) was blowing warm air. A maintenance ticket is logged and a technician is on the way, ETA ~7 minutes.",
    seed: [
      { role: "user", text: "the ac in my room isn't cooling, just blowing warm air", time: "10:42" },
      {
        role: "assistant",
        text: "Sorry about that. I've logged a maintenance request for room 204 — a technician will take care of it today. I'll keep you posted here.",
        time: "10:43",
      },
      {
        role: "assistant",
        time: "11:08",
        widget: {
          type: "statusWidget",
          data: {
            title: "Technician on the way",
            state: "in_progress",
            detail: "Maintenance · Room 204",
            eta: "Arriving in ~7 min",
            stages: [
              { label: "Submitted", done: true },
              { label: "Acknowledged", done: true },
              { label: "Assigned", done: true },
              { label: "In progress", done: false },
              { label: "Resolved", done: false },
            ],
          },
        },
      },
    ],
  },
  {
    id: "late-checkout",
    topic: "Late checkout",
    emoji: "🕑",
    state: "open",
    filter: "updates",
    unread: true,
    preview: "Want 2 extra hours on Sunday?",
    time: "14:20",
    hint: "This is a Lumi-initiated late-checkout offer. The guest can extend checkout by 2 hours (to 2pm) for €25.",
    seed: [
      {
        role: "assistant",
        time: "14:20",
        text: "Want 2 extra hours on Sunday? I can extend your checkout to 2:00 PM for €25.",
        widget: {
          type: "quickReply",
          data: { options: ["Add for €25", "No thanks", "Tell me more"] },
        },
      },
    ],
  },
  {
    id: "ramen",
    topic: "Ramen",
    emoji: "🍜",
    state: "open",
    filter: "support",
    preview: "Two great options nearby…",
    time: "11:45",
    hint: "The guest asked for ramen recommendations near Numa Berlin Novela. Cocolo Ramen (8 min walk) and Takumi Nine (12 min walk) were suggested.",
    seed: [
      { role: "user", text: "any good ramen near here?", time: "11:45" },
      {
        role: "assistant",
        text: "Two great options near Numa Berlin Novela:",
        time: "11:45",
        widget: {
          type: "mapWidget",
          data: {
            title: "Ramen nearby",
            pois: BERLIN_POIS.filter((p) => p.type === "Ramen"),
          },
        },
      },
    ],
  },
  {
    id: "towels",
    topic: "Towels",
    emoji: "🛁",
    state: "resolved",
    filter: "support",
    preview: "Delivered. All set?",
    time: "10:55",
    hint: "A housekeeping request for extra towels in room 204. It has been delivered and resolved.",
    seed: [
      {
        role: "user",
        text: "hey can i get extra towels in my room? we're 2 people but only got towels for 1",
        time: "09:14",
      },
      {
        role: "assistant",
        text: "Got it — sending two extra sets to room 204. Should arrive within 20 min.",
        time: "09:15",
      },
      {
        role: "assistant",
        text: "Delivered to room 204. Anything else for the towels, or all set?",
        time: "10:55",
        widget: {
          type: "statusWidget",
          data: {
            title: "Towels delivered",
            state: "resolved",
            detail: "Housekeeping · Room 204",
          },
        },
      },
    ],
  },
  {
    id: "lisbon-booking",
    topic: "Lisbon trip",
    emoji: "✈️",
    state: "open",
    filter: "support",
    preview: "Check-in Mon Oct 7 · Book stay",
    time: "09:31",
    hint: "The guest is asking about booking a trip to Lisbon. Show a reservation card for Numa Lisbon with check-in Oct 7 and check-out Oct 9.",
    seed: [
      { role: "user", text: "Can I book the dates of the Lisbon trip?", time: "09:31" },
      {
        role: "assistant",
        text: "Here's the stay — tap the button below to confirm your booking.",
        time: "09:31",
        widget: {
          type: "reservationCard",
          data: {
            property: "Numa Lisbon Baixa",
            location: "Lisbon, Portugal",
            checkIn: "Mon, Oct 7 · 2:00 PM CET",
            checkOut: "Wed, Oct 9 · 11:00 AM CET",
            action: "Book stay",
          },
        },
      },
    ],
  },
  {
    id: "barcelona",
    topic: "Barcelona Palmera",
    emoji: "🏠",
    state: "open",
    filter: "support",
    preview: "Browsing · What's included?",
    time: "Yesterday",
    hint: "The guest is researching a prospective future stay at Numa Barcelona Palmera (not their current trip). They asked what's included.",
    seed: [
      { role: "user", text: "what's included at the Barcelona property?", time: "16:00" },
      {
        role: "assistant",
        text: "Numa Barcelona Palmera sits in El Born. Here's a look — every room includes self check-in, fast Wi-Fi and a kitchenette.",
        time: "16:00",
        widget: {
          type: "propertyCarousel",
          data: { items: [barcelona, ...PROPERTIES.filter((p) => p.id !== "barcelona-palmera")] },
        },
      },
    ],
  },
  {
    id: "parking",
    topic: "Numa Berlin Novela",
    emoji: "📢",
    state: "closed",
    filter: "updates",
    preview: "We'd like to inform you the parking lot…",
    time: "May 30",
    hint: "A one-way broadcast notice from the property team about the parking lot.",
    seed: [
      {
        role: "assistant",
        text: "Heads up from the Numa Berlin Novela team: the parking lot will be closed for construction this Thursday, 9am–4pm. Street parking is available nearby — let me know if you'd like directions to the closest garage.",
        time: "May 30",
      },
    ],
  },
  {
    id: "offers",
    topic: "Numa Offers",
    emoji: "🎁",
    state: "closed",
    filter: "updates",
    preview: "Our seasonal deal is only available…",
    time: "May 28",
    hint: "A one-way marketing broadcast about a seasonal offer.",
    seed: [
      {
        role: "assistant",
        text: "Our seasonal deal is live — book your next Numa stay by June 15 and save 15%. Want me to show what's available for your dates?",
        time: "May 28",
        widget: { type: "imageCard", data: { images: [IMG.hero], caption: "Save 15% on your next Numa stay" } },
      },
    ],
  },
];

export function getThread(id: string | undefined): Thread | undefined {
  if (!id) return undefined;
  return THREADS.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Seed → persisted thread conversion
//
// The persisted thread store keeps full UIMessage histories so that re-opening
// a thread can hand `messages` straight back to `useChat`. To make demo
// threads first-class members of that store, we convert each SeedMessage into
// a UIMessage with the matching parts (text + tool-<widget> parts).
// ---------------------------------------------------------------------------

let seedMessageCounter = 0;
function seedMessageId(threadId: string): string {
  seedMessageCounter += 1;
  return `seed-${threadId}-${seedMessageCounter}`;
}

function seedMessageToUIMessage(threadId: string, m: SeedMessage): UIMessage {
  const parts: UIMessage["parts"] = [];

  if (m.text) {
    parts.push({ type: "text", text: m.text });
  }

  if (m.widget) {
    // Build a tool part that matches the shape live tool calls produce, so the
    // existing render path in ThreadView (toolPartToWidgetType + state ===
    // "output-available") renders demo widgets identically.
    parts.push({
      type: `tool-${m.widget.type}`,
      toolCallId: `seed-tool-${seedMessageId(threadId)}`,
      state: "output-available",
      input: {},
      output: m.widget.data,
    } as unknown as UIMessage["parts"][number]);
  }

  return {
    id: seedMessageId(threadId),
    role: m.role,
    parts,
  };
}

function threadToPersisted(t: Thread, now: number): PersistedThread {
  return {
    id: t.id,
    topic: t.topic,
    emoji: t.emoji,
    filter: t.filter,
    state: t.state,
    hint: t.hint,
    messages: t.seed.map((m) => seedMessageToUIMessage(t.id, m)),
    createdAt: now,
    updatedAt: now,
    active: t.active,
    unread: t.unread,
    source: "demo",
    // Carry the hand-crafted display strings through so demos read like the
    // designed inbox, not auto-derived "Status update / 15:55" stand-ins.
    preview: t.preview,
    time: t.time,
  };
}

// Snapshot of the demo inbox, ready to drop into the zustand store.
export function demoSeedThreads(): PersistedThread[] {
  const now = Date.now();
  seedMessageCounter = 0;
  return THREADS.map((t) => threadToPersisted(t, now));
}
