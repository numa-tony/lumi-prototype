import type { ScreenId, WidgetData } from "@/lib/types";
import type { SmartRoomDevices } from "@/lib/smartRoom";

// ── Step types ────────────────────────────────────────────────────────────────
// Each Step is one atomic action in a beat's sequence.
// Convention: the FIRST step of each beat is Sarah's action (what the player
// triggers by pressing →). Subsequent steps are Lumi/world auto-reactions.

export type Step =
  // In-app Lumi
  | { kind: "openChat" }                               // FAB tap → sheet up (idle)
  | { kind: "closeChat" }
  | { kind: "userMsg"; text: string }                  // typewriter → send → user bubble
  | { kind: "tapReply"; text: string }                 // instant tap on a quick-reply chip (no typewriter)
  | { kind: "openThread"; id: string }                 // open a seeded thread in storyChat
  | { kind: "lumiTyping"; ms?: number }                // typing dots for ms (default 1200)
  | { kind: "lumiMsg"; text?: string; widget?: WidgetData }   // append Lumi bubble/widget
  // WA phone scripted conversation
  | { kind: "waUserMsg"; text: string }                // typewriter → send on WA phone
  | { kind: "waLumiTyping"; ms?: number }              // WA typing dots for ms
  | { kind: "waLumiMsg"; text?: string; widget?: WidgetData } // append Lumi bubble on WA
  // Scripted voice mode (mimics VoiceSheet — no mic / no live AI)
  | { kind: "voiceOpen" }                              // slide the voice sheet up
  | { kind: "voiceClose" }
  | { kind: "voiceListen"; text: string }              // "listening" — waveform + transcript types out + TTS
  | { kind: "voiceRespond"; text: string }             // "speaking" — Lumi confirmation
  // World / room
  | { kind: "scene"; patch: Partial<SmartRoomDevices> }       // room device change
  | { kind: "breakout"; value: boolean }               // SmartRoomScene visibility
  | { kind: "frontDoor"; open: boolean | null }         // null=hidden, false=visible+closed, true=open
  | { kind: "fadeToBlack"; ms?: number }               // backdrop overlay fade (default 600)
  | { kind: "setInStay"; value: boolean }
  | { kind: "setWaEnabled"; value: boolean }
  | { kind: "resetWa" }
  | { kind: "clearThreads" }
  | { kind: "loadThread"; id: string }
  | { kind: "go"; screen: ScreenId }
  | { kind: "wait"; ms: number };

// ── Segment metadata ──────────────────────────────────────────────────────────
// 9 narrative beats shown in the progress rail. Each PressBeat below belongs to
// a segment (segmentIndex 0–8).

export interface Segment {
  id: string;
  label: string;
}

export const SEGMENTS: Segment[] = [
  { id: "title",    label: "Title" },
  { id: "arrival",  label: "Arrival" },
  { id: "room",     label: "Room" },
  { id: "towels",   label: "Towels" },
  { id: "ac",       label: "AC" },
  { id: "ramen",    label: "Ramen" },
  { id: "checkout", label: "Checkout" },
  { id: "climax",   label: "Climax" },
  { id: "thesis",   label: "Thesis" },
];

// ── PressBeat ─────────────────────────────────────────────────────────────────
// Each entry = one → key press. Steps execute in order, with delays between them.

export type SarahEmotion = "neutral" | "happy" | "annoyed" | "content" | "surprised";

export interface PressBeat {
  id: string;
  segmentIndex: number;  // index into SEGMENTS — drives progress rail
  background: string;    // CSS background (transitions smoothly)
  narration?: string;    // yellow caption top-left
  sarah?: string;        // speech bubble bottom-left
  sarahEmotion?: SarahEmotion;
  titleCard?: boolean;
  thesisCard?: boolean;
  steps: Step[];         // executed in order when this beat plays
}

const DARK_NAVY = "linear-gradient(160deg, #0a1220 0%, #06080f 100%)";
const DARK_ROOM = "linear-gradient(160deg, #050508 0%, #080a10 100%)";
const WARM_ROOM = "linear-gradient(160deg, #100c08 0%, #180d0c 100%)";

export const STORY: PressBeat[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 0 — Title
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "title",
    segmentIndex: 0,
    background: "#1a1a1a",
    titleCard: true,
    steps: [
      { kind: "clearThreads" },
      { kind: "setWaEnabled", value: false },
      { kind: "setInStay", value: false },
      { kind: "breakout", value: false },
      { kind: "frontDoor", open: null },
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 1 — Arrival: "I'm in front of the building"
  // ══════════════════════════════════════════════════════════════════════════

  // Press 1 — night exterior appears: closed door + rain. Narration sets the scene.
  {
    id: "arrival-setup",
    segmentIndex: 1,
    background: DARK_NAVY,
    narration: "Friday, 7pm. Sarah just arrived from a long flight. It's raining outside. She doesn't know her PIN.",
    steps: [
      { kind: "frontDoor", open: false },   // show FrontDoorScene with door closed
    ],
  },

  // Press 2 — she taps FAB → Lumi chat slides up (idle "Ask anything")
  {
    id: "arrival-open-chat",
    segmentIndex: 1,
    background: DARK_NAVY,
    narration: "Friday, 7pm. Sarah just arrived from a long flight. It's raining outside. She doesn't know her PIN.",
    steps: [
      { kind: "openChat" },
    ],
  },

  // Press 3 — she sends the message → Lumi opens door + gives PIN → door swings open
  {
    id: "arrival-message",
    segmentIndex: 1,
    background: DARK_NAVY,
    narration: "Friday, 7pm. Sarah just arrived from a long flight. It's raining outside. She doesn't know her PIN.",
    sarah: "i'm in front of the building? how do i get in?",
    sarahEmotion: "neutral",
    steps: [
      { kind: "userMsg", text: "i'm in front of the building? how do i get in?" },
      { kind: "lumiTyping", ms: 1200 },
      { kind: "lumiMsg", text: "I've opened the front door for you. If you want to use the pin pad, the code is 39203 ✔️" },
      { kind: "wait", ms: 350 },
      { kind: "frontDoor", open: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 2 — Room: lights + blinds
  // ══════════════════════════════════════════════════════════════════════════

  // Press 4 — she steps inside; background fades to black as the exterior disappears
  {
    id: "room-setup",
    segmentIndex: 2,
    background: DARK_ROOM,
    narration: "She enters her room. But it's dark and she can't see where the light switch is.",
    steps: [
      { kind: "closeChat" },
      { kind: "fadeToBlack", ms: 500 },
      { kind: "frontDoor", open: null },
      { kind: "setInStay", value: true },
    ],
  },

  // Press 5 — she taps FAB; fresh Lumi chat opens (clean idle state)
  {
    id: "room-open-chat",
    segmentIndex: 2,
    background: DARK_ROOM,
    narration: "She enters her room. But it's dark and she can't see where the light switch is.",
    steps: [
      { kind: "openChat" },
    ],
  },

  // Press 6 — "can you turn on the lights?" → SmartRoom breaks out, lights flood on
  {
    id: "room-lights",
    segmentIndex: 2,
    background: DARK_ROOM,
    narration: "She enters her room. But it's dark and she can't see where the light switch is.",
    sarah: "can you turn on the lights?",
    sarahEmotion: "neutral",
    steps: [
      { kind: "userMsg", text: "can you turn on the lights?" },
      { kind: "lumiTyping", ms: 900 },
      { kind: "scene", patch: { lights: { on: true, brightness: 75, warmth: "warm" } } },
      { kind: "breakout", value: true },
      { kind: "lumiMsg", text: "Done! Lights are on 💡" },
    ],
  },

  // Press 7 — "can you open the blinds?" → blinds roll up
  {
    id: "room-blinds",
    segmentIndex: 2,
    background: WARM_ROOM,
    narration: "Lights on. Now she opens the blinds to the city.",
    sarah: "can you open the blinds?",
    sarahEmotion: "happy",
    steps: [
      { kind: "userMsg", text: "can you open the blinds?" },
      { kind: "lumiTyping", ms: 700 },
      { kind: "scene", patch: { blinds: { position: 100 } } },
      { kind: "lumiMsg", text: "Blinds open ✓" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 3 — Towels: WhatsApp cross-channel reveal
  // ══════════════════════════════════════════════════════════════════════════

  // Press 8 — she goes to the bathroom; WA phone appears; app shows Messages with stay thread
  {
    id: "towels-setup",
    segmentIndex: 3,
    background: WARM_ROOM,
    narration: "She goes to the bathroom. She needs more towels. Already in WhatsApp texting a friend, she goes to the Lumi thread in WhatsApp.",
    steps: [
      { kind: "closeChat" },
      { kind: "loadThread", id: "stay" },   // in-app arrival thread (door, lights, blinds)
      { kind: "go", screen: "messages" },
      { kind: "setWaEnabled", value: true },
      { kind: "resetWa" },
    ],
  },

  // Press 9 — she asks where to get towels on WA → Lumi gives self-service location → new thread bridges to inbox
  {
    id: "towels-wa-message",
    segmentIndex: 3,
    background: WARM_ROOM,
    narration: "She goes to the bathroom. She needs more towels. Already in WhatsApp texting a friend, she goes to the Lumi thread in WhatsApp.",
    sarah: "where are the towels?",
    sarahEmotion: "neutral",
    steps: [
      { kind: "waUserMsg", text: "where can i get extra towels?" },
      { kind: "waLumiTyping", ms: 900 },
      { kind: "waLumiMsg", text: "Extra towels are in the Essentials closet on the first floor — just past the lift 🛁" },
      { kind: "wait", ms: 500 },
      { kind: "loadThread", id: "towels" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 4 — AC: frustration + status widget
  // ══════════════════════════════════════════════════════════════════════════

  // Press 10 — narration shifts to AC frustration
  {
    id: "ac-setup",
    segmentIndex: 4,
    background: WARM_ROOM,
    narration: "Summer heat. She turns the AC on. Warm air.",
    steps: [],
  },

  // Press 11 — she reports it on WhatsApp → ticket + status widget; thread bridges
  {
    id: "ac-message",
    segmentIndex: 4,
    background: WARM_ROOM,
    narration: "Summer heat. She turns the AC on. Warm air.",
    sarah: "the AC isn't working",
    sarahEmotion: "annoyed",
    steps: [
      { kind: "waUserMsg", text: "the AC in my room isn't cooling, just blowing warm air" },
      { kind: "waLumiTyping", ms: 1200 },
      { kind: "waLumiMsg", text: "Sorry about that! I've logged a maintenance ticket for room 204 — a technician is on the way." },
      { kind: "wait", ms: 400 },
      { kind: "waLumiMsg", widget: {
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
      }},
      { kind: "wait", ms: 300 },
      { kind: "loadThread", id: "ac" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 5 — Ramen: quick-reply → map widget
  // ══════════════════════════════════════════════════════════════════════════

  // Press 12 — she taps the AC thread in the app inbox → sees status widget in full
  {
    id: "ac-open-thread",
    segmentIndex: 4,
    background: WARM_ROOM,
    narration: "Summer heat. She turns the AC on. Warm air.",
    sarah: "checks status in the app",
    sarahEmotion: "annoyed",
    steps: [
      { kind: "openThread", id: "ac" },
    ],
  },

  // Press 13 — WA phone hides; she's hungry and doesn't know what she wants
  {
    id: "ramen-setup",
    segmentIndex: 5,
    background: WARM_ROOM,
    narration: "She's hungry. She doesn't know what she wants.",
    steps: [
      { kind: "setWaEnabled", value: false },
      { kind: "go", screen: "explore" },
    ],
  },

  // Press 13 — she opens Lumi (fresh chat)
  {
    id: "ramen-open",
    segmentIndex: 5,
    background: WARM_ROOM,
    narration: "She's hungry. She doesn't know what she wants.",
    steps: [
      { kind: "openChat" },
    ],
  },

  // Press 14 — she asks what to eat → Lumi shows quick-reply options
  {
    id: "ramen-message",
    segmentIndex: 5,
    background: WARM_ROOM,
    narration: "She's hungry. She doesn't know what she wants.",
    sarah: "I'm hungry and don't know what I want",
    sarahEmotion: "neutral",
    steps: [
      { kind: "userMsg", text: "I'm hungry and I don't know what I want" },
      { kind: "lumiTyping", ms: 900 },
      { kind: "lumiMsg", text: "I've got you. What are you feeling?", widget: {
        type: "quickReply",
        data: { options: ["Ramen 🍜", "Pizza 🍕", "Sushi 🍣", "Burgers 🍔"] },
      }},
    ],
  },

  // Press 15 — she taps the "Ramen 🍜" chip → map widget with nearby spots
  {
    id: "ramen-pick",
    segmentIndex: 5,
    background: WARM_ROOM,
    narration: "She's hungry. She doesn't know what she wants.",
    sarah: "Ramen 🍜",
    sarahEmotion: "happy",
    steps: [
      { kind: "tapReply", text: "Ramen 🍜" },
      { kind: "lumiTyping", ms: 700 },
      { kind: "lumiMsg", text: "Two great spots near Numa Berlin Novela:", widget: {
        type: "mapWidget",
        data: {
          title: "Ramen nearby",
          pois: [
            { name: "Cocolo Ramen", type: "Ramen", rating: 4.6, walk: "8 min walk" },
            { name: "Takumi Nine", type: "Ramen", rating: 4.4, walk: "12 min walk" },
          ],
        },
      }},
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 6 — Late checkout: reservation card + offer
  // ══════════════════════════════════════════════════════════════════════════

  // Press 16 — Sunday morning, one question on her mind
  {
    id: "checkout-setup",
    segmentIndex: 6,
    background: WARM_ROOM,
    narration: "Sunday morning. One question on her mind.",
    steps: [
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
      { kind: "scene", patch: { windowSky: "morning" } },
    ],
  },

  // Press 17 — she opens Lumi (fresh chat)
  {
    id: "checkout-open",
    segmentIndex: 6,
    background: WARM_ROOM,
    narration: "Sunday morning. One question on her mind.",
    steps: [
      { kind: "openChat" },
    ],
  },

  // Press 18 — "what time is my checkout?" → reservation card + late checkout offer
  {
    id: "checkout-asks",
    segmentIndex: 6,
    background: WARM_ROOM,
    narration: "Sunday morning. One question on her mind.",
    sarah: "what time is my checkout?",
    sarahEmotion: "neutral",
    steps: [
      { kind: "userMsg", text: "what time is my checkout?" },
      { kind: "lumiTyping", ms: 1000 },
      { kind: "lumiMsg", widget: {
        type: "reservationCard",
        data: {
          property: "Numa Berlin Novela",
          location: "Berlin, Germany",
          checkIn: "Fri, Jun 6 · 3:00 PM",
          checkOut: "Sun, Jun 8 · 11:00 AM",
          room: "Room 204",
          doorCode: "39203",
          status: "Confirmed",
        },
      }},
      { kind: "wait", ms: 300 },
      { kind: "lumiMsg", text: "You're set for 11:00 AM. Want to extend to 1pm for €20? I can sort it right now.", widget: {
        type: "quickReply",
        data: { options: ["Yes, book it for €20", "No thanks"] },
      }},
    ],
  },

  // Press 19 — she taps "Yes, book it for €20" chip → checkout confirmed
  {
    id: "checkout-accept",
    segmentIndex: 6,
    background: WARM_ROOM,
    narration: "Sunday morning. One question on her mind.",
    sarah: "Yes, book it!",
    sarahEmotion: "surprised",
    steps: [
      { kind: "tapReply", text: "Yes, book it for €20" },
      { kind: "lumiTyping", ms: 800 },
      { kind: "lumiMsg", text: "Done! You're all set until 1:00 PM on Sunday 🎉 Enjoy your extra morning." },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 7 — Room climax: Netflix + blinds + lights off
  // ══════════════════════════════════════════════════════════════════════════

  // Press 20 — the last evening; she's earned it. Room reveals; she just talks now.
  {
    id: "climax-setup",
    segmentIndex: 7,
    background: DARK_ROOM,
    narration: "The last evening. She's earned it — no typing now, she just talks to Lumi.",
    steps: [
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
      { kind: "scene", patch: { windowSky: "evening" } },
      { kind: "setInStay", value: true },
      { kind: "breakout", value: true },
    ],
  },

  // Press 21 — she opens voice mode (the scripted VoiceSheet slides up)
  {
    id: "climax-open",
    segmentIndex: 7,
    background: DARK_ROOM,
    narration: "The last evening. She's earned it — no typing now, she just talks to Lumi.",
    steps: [
      { kind: "voiceOpen" },
    ],
  },

  // Press 22 — she SAYS "put Netflix on" → waveform + transcript → TV on
  {
    id: "climax-netflix",
    segmentIndex: 7,
    background: DARK_ROOM,
    narration: "The last evening. She's earned it — no typing now, she just talks to Lumi.",
    steps: [
      { kind: "voiceListen", text: "put Netflix on" },
      { kind: "scene", patch: { tv: { on: true, app: "Netflix", volume: 35, muted: false, channel: null } } },
      { kind: "breakout", value: true },
      { kind: "voiceRespond", text: "Netflix is on 🍿 Enjoy!" },
    ],
  },

  // Press 23 — she SAYS "close the blinds"
  {
    id: "climax-blinds",
    segmentIndex: 7,
    background: DARK_ROOM,
    narration: "The last evening. She's earned it — no typing now, she just talks to Lumi.",
    steps: [
      { kind: "voiceListen", text: "close the blinds" },
      { kind: "scene", patch: { blinds: { position: 0 } } },
      { kind: "voiceRespond", text: "Blinds closed ✓" },
    ],
  },

  // Press 24 — she SAYS "turn off the lights" → quiet, earned ending
  {
    id: "climax-lights",
    segmentIndex: 7,
    background: DARK_ROOM,
    narration: "The last evening. She's earned it — no typing now, she just talks to Lumi.",
    steps: [
      { kind: "voiceListen", text: "turn off the lights" },
      { kind: "scene", patch: { lights: { on: false, brightness: 0, warmth: "warm" } } },
      { kind: "voiceRespond", text: "Lights off. Just you and Netflix 🌙" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEGMENT 8 — Thesis
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "thesis",
    segmentIndex: 8,
    background: "linear-gradient(160deg, #06040e 0%, #0d0a14 100%)",
    thesisCard: true,
    steps: [
      { kind: "voiceClose" },
      { kind: "breakout", value: false },
      { kind: "closeChat" },
      { kind: "setWaEnabled", value: false },
      { kind: "go", screen: "explore" },
    ],
  },
];
