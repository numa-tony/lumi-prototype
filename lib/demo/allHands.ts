import type { PressBeat, Segment } from "./types";
import { IMG } from "@/lib/mock/properties";

// ─────────────────────────────────────────────────────────────────────────────
// "It started with an air conditioner." — the All-Hands walkthrough.
//
// Scripted from Lumi All-Hands — Script & Run-of-Show (Draft 2). One → press per
// entry below; the presenter is the narration, so the stage carries no captions.
// Everything is canned: no live AI, no TTS, no mic, no network.
//
// The stage stays black for this first round — room/scene visuals come later.
// Room changes still flow through `scene` steps (the store's smartRoom updates
// exactly as it does in Sarah's Day), so dropping a background scene back in is
// a matter of mounting it, not rescripting the story.
// ─────────────────────────────────────────────────────────────────────────────

const STAGE = "#000000";

// The stay this story runs on. Read by Explore / My Trips / Trip Detail / Your
// room while the All-Hands story is active, so the app agrees with the script:
// Thursday to Sunday in July, second night is Friday — the night of the AC.
export const ALLHANDS_STAY = {
  property: "Numa Berlin Friedrichshain",
  city: "Berlin",
  location: "Boxhagener Str. 18, Friedrichshain",
  room: "204",
  roomType: "Medium Studio with Kitchenette",
  checkIn: "Thu, Jul 9 · 3:00 PM",
  checkOut: "Sun, Jul 12 · 11:00 AM",
  checkInDate: "Thu, Jul 9",
  checkInTime: "3:00 PM CET",
  checkOutDate: "Sun, Jul 12",
  checkOutTime: "11:00 AM CET",
  dates: "Jul 9 – 12, 2026",
  doorCode: "2930",
  reservationId: "FJKD3K",
  image: "/allhands/room-hero.png",
};

export const ALLHANDS_SEGMENTS: Segment[] = [
  { id: "title",    label: "Title" },
  { id: "ac",       label: "The room won't cool down" },
  { id: "follow",   label: "Follow this in the app" },
  { id: "ask",      label: "She realises she can just ask" },
  { id: "lunch",    label: "Lunch, and twenty euros" },
  { id: "train",    label: "The train home" },
  { id: "end",      label: "End" },
];

// Starter sets for the idle "Ask Lumi" screen — what Lumi offers from wherever
// she happens to be standing.
const STARTERS_ROOM = [
  "What's the WiFi password?",
  "How does the coffee machine work?",
  "Can you turn on the lights?",
];
const STARTERS_LUNCH = [
  "Anywhere nice to eat near here?",
  "What's around the building?",
  "What time is my checkout?",
];
const STARTERS_CHECKOUT = [
  "What time is my checkout?",
  "Can I leave my bags somewhere?",
  "How do I get to the airport?",
];
const STARTERS_TRAIN = [
  "Plan my next trip",
  "Which Numa should I stay at in London?",
  "Show my past stays",
];

export const ALLHANDS: PressBeat[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // T0 — Opening frame: the phone centred, showing an empty WhatsApp thread
  // with Numa. No title text — the presenter opens the story, not the stage.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "title",
    segmentIndex: 0,
    background: STAGE,
    titleCard: true,
    steps: [
      { kind: "clearThreads" },
      { kind: "clearRequest" },
      { kind: "setInStay", value: true },
      { kind: "stayVisible", value: true },
      { kind: "breakout", value: false },
      { kind: "frontDoor", open: null },
      { kind: "closeChat" },
      { kind: "starters", items: STARTERS_ROOM },
      { kind: "go", screen: "explore" },
      { kind: "surface", value: "whatsapp" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 01 — The room won't cool down
  // ══════════════════════════════════════════════════════════════════════════

  // T1 — Sarah messages Numa on WhatsApp. Where every guest problem starts.
  {
    id: "wa-message",
    segmentIndex: 1,
    background: STAGE,
    steps: [
      { kind: "surface", value: "whatsapp" },
      {
        kind: "waUserMsg",
        text: "Hi, the AC in room 204 is blowing warm air 🥵 it's my second night and it's boiling in here",
        time: "9:39 PM",
      },
    ],
  },

  // T2 — The bot answers and escalates. Then, three seconds later and without
  // the presenter touching anything, the one extra line lands: the message
  // stops being a message. The pause in between is the whole beat.
  {
    id: "wa-escalate",
    segmentIndex: 1,
    background: STAGE,
    steps: [
      { kind: "waTyping", ms: 1400 },
      {
        kind: "waLumiMsg",
        text: "Hi Sarah — sorry about that, not the welcome you want after a long day. I've opened a request for the AC in room 204 and passed it to the team. Someone will be in touch.",
        time: "9:40 PM",
      },
      { kind: "wait", ms: 3000 },
      { kind: "waTyping", ms: 900 },
      {
        kind: "waLumiMsg",
        text: "You can follow this live in the Numa app, and reach me there anytime:",
        link: "numa.app/r/204-ac",
        time: "9:41 PM",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 02 — "You can follow this in the app"
  // ══════════════════════════════════════════════════════════════════════════

  // T3 — She taps the link and lands straight on the request. The chat is
  // opened before the app is revealed, so the jump goes WhatsApp → the pinned
  // status with nothing in between.
  {
    id: "app-pinned-status",
    segmentIndex: 2,
    background: STAGE,
    steps: [
      { kind: "startRequest" },
      // The inbox sits underneath, so closing the sheet later reveals it
      // directly rather than passing back through Explore.
      { kind: "go", screen: "messages" },
      { kind: "loadThread", id: "allhands-ac" },
      { kind: "openChat" },
      { kind: "surface", value: "app" },
    ],
  },

  // T4 — Because it's a conversation, she just asks the next thing.
  {
    id: "app-next-question",
    segmentIndex: 2,
    background: STAGE,
    steps: [
      { kind: "userMsg", text: "Do I need to be in the room for this?" },
      { kind: "lumiTyping", ms: 1100 },
      {
        kind: "lumiMsg",
        text: "No — the Numa technician can let himself in if you're out. If you'd rather be there, just say so and I'll have him knock first.",
      },
    ],
  },

  // T5 — She taps back and finds an inbox. One thing in it, because she's only
  // asked us one thing.
  {
    id: "inbox",
    segmentIndex: 2,
    background: STAGE,
    steps: [
      { kind: "hideChat" },
    ],
  },

  // T6 — Home screen. Our logo, and the countdown, at the top of her phone.
  {
    id: "home-island",
    segmentIndex: 2,
    background: STAGE,
    steps: [
      { kind: "surface", value: "home" },
      { kind: "island", expanded: false },
    ],
  },

  // T7 — She taps it, and the whole thing opens up.
  {
    id: "home-island-expanded",
    segmentIndex: 2,
    background: STAGE,
    steps: [
      { kind: "island", expanded: true },
    ],
  },

  // T8 — Or if the phone is just sitting there: the same status, on the lock screen.
  {
    id: "lock-activity",
    segmentIndex: 2,
    background: STAGE,
    steps: [
      { kind: "surface", value: "lock" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 03 — She realises she can just ask
  // ══════════════════════════════════════════════════════════════════════════

  // T9 — Taps the widget → back into the chat, status still pinned.
  {
    id: "back-to-chat",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "surface", value: "app" },
      { kind: "go", screen: "messages" },
      { kind: "showChat" },
    ],
  },

  // T10 — Back to the inbox.
  { id: "walk-inbox", segmentIndex: 3, background: STAGE, steps: [{ kind: "hideChat" }, { kind: "go", screen: "messages" }] },

  // T11 — Out to Explore. And she notices the button, floating at the bottom.
  { id: "walk-explore", segmentIndex: 3, background: STAGE, steps: [{ kind: "go", screen: "explore" }] },

  // T12 — My Trips. Wherever she goes, it goes.
  { id: "walk-trips", segmentIndex: 3, background: STAGE, steps: [{ kind: "go", screen: "trips" }] },

  // T13 — Her stay in Berlin Friedrichshain.
  { id: "walk-trip-detail", segmentIndex: 3, background: STAGE, steps: [{ kind: "go", screen: "tripDetail" }] },

  // T14 — Your room.
  { id: "walk-your-room", segmentIndex: 3, background: STAGE, steps: [{ kind: "go", screen: "yourRoom" }] },

  // T15 — She taps Ask Lumi. Because Lumi knows what she was just looking at,
  // it offers her things worth asking from right here.
  {
    id: "ask-lumi-open",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      // The AC is fixed and this is a different conversation — the request
      // stops following her around once she's asking about something else.
      { kind: "clearRequest" },
      { kind: "starters", items: STARTERS_ROOM },
      { kind: "openChat" },
    ],
  },

  // T16 — "Hang on. Let me try something." She taps the third one.
  {
    id: "lights-on",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "tapReply", text: "Can you turn on the lights?" },
      { kind: "lumiTyping", ms: 900 },
      { kind: "scene", patch: { lights: { on: true, brightness: 75, warmth: "warm" } } },
      { kind: "lumiMsg", text: "Done — lights are on 💡" },
    ],
  },

  // T17 — No hunting for a switch in the dark.
  {
    id: "lights-off",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "userMsg", text: "turn off the lights" },
      { kind: "lumiTyping", ms: 800 },
      { kind: "scene", patch: { lights: { on: false, brightness: 0, warmth: "warm" } } },
      { kind: "lumiMsg", text: "Lights off. Sleep well, Sarah 🌙" },
    ],
  },

  // T18 — Next morning, from bed: open the blinds. And Berlin shows up.
  {
    id: "blinds-morning",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "fadeToBlack", ms: 700 },
      { kind: "scene", patch: { windowSky: "morning" } },
      { kind: "divider", label: "Sat 11 Jul · 8:14 AM" },
      { kind: "userMsg", text: "open the blinds" },
      { kind: "lumiTyping", ms: 800 },
      { kind: "scene", patch: { blinds: { position: 100 } } },
      { kind: "lumiMsg", text: "Blinds are open — good morning, Berlin ☀️" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 04 — Lunch, and twenty euros
  // ══════════════════════════════════════════════════════════════════════════

  // T19 — Lunchtime. She wants to eat somewhere good and has no idea where.
  {
    id: "lunch-open",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
      { kind: "fadeToBlack", ms: 600 },
      { kind: "starters", items: STARTERS_LUNCH },
      { kind: "openChat" },
    ],
  },

  // T20 — Lumi doesn't hand her a paragraph. It asks her a better question.
  {
    id: "lunch-ask",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "userMsg", text: "anywhere nice to eat near here?" },
      { kind: "lumiTyping", ms: 900 },
      {
        kind: "lumiMsg",
        text: "I've got you — what are you feeling?",
        widget: {
          type: "quickReply",
          data: { options: ["🍜 Ramen", "🍕 Pizza", "🍣 Sushi", "🍔 Burgers"] },
        },
      },
    ],
  },

  // T21 — The difference between telling and doing. A map, ready to walk to.
  {
    id: "lunch-map",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "tapReply", text: "🍜 Ramen" },
      { kind: "lumiTyping", ms: 900 },
      {
        kind: "lumiMsg",
        text: "Two great spots near Numa Berlin Friedrichshain:",
        widget: {
          type: "mapWidget",
          data: {
            pois: [
              { name: "Cocolo Ramen", type: "Ramen", rating: 4.6, walk: "8 min walk", image: "/allhands/poi-cocolo.png" },
              { name: "Takumi Nine", type: "Ramen", rating: 4.4, walk: "12 min walk" },
            ],
          },
        },
      },
    ],
  },

  // T22 — Sunday morning. The last question of the stay.
  {
    id: "checkout-open",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
      { kind: "fadeToBlack", ms: 600 },
      { kind: "starters", items: STARTERS_CHECKOUT },
      { kind: "openChat" },
    ],
  },

  // T23 — Lumi shows her the whole thing — and then offers her the extra hours.
  {
    id: "checkout-ask",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "userMsg", text: "What time is my checkout?" },
      { kind: "lumiTyping", ms: 1000 },
      {
        kind: "lumiMsg",
        widget: {
          type: "reservationCard",
          data: {
            property: ALLHANDS_STAY.property,
            location: ALLHANDS_STAY.location,
            checkIn: `${ALLHANDS_STAY.checkInDate}\n${ALLHANDS_STAY.checkInTime}`,
            checkOut: `${ALLHANDS_STAY.checkOutDate}\n${ALLHANDS_STAY.checkOutTime}`,
            room: ALLHANDS_STAY.room,
          },
        },
      },
      { kind: "wait", ms: 320 },
      {
        kind: "lumiMsg",
        text: "You're set for 11:00 AM. Want to extend to 1pm for €20? I can sort it right now.",
        widget: {
          type: "quickReply",
          data: { options: ["Yes, book it for €20", "No thanks"] },
        },
      },
    ],
  },

  // T24 — Twenty euros we have never asked for, at the exact second she'd say yes.
  {
    id: "checkout-accept",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "tapReply", text: "Yes, book it for €20" },
      { kind: "lumiTyping", ms: 900 },
      { kind: "lumiMsg", text: "Done — checkout is now 1:00 PM. Enjoy the slow morning ☕" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 05 — The train home
  // ══════════════════════════════════════════════════════════════════════════

  // T25 — Sunday afternoon, on the train. The stay's over, nothing booked next.
  {
    id: "train-open",
    segmentIndex: 5,
    background: STAGE,
    steps: [
      { kind: "closeChat" },
      { kind: "stayVisible", value: false },
      { kind: "setInStay", value: false },
      { kind: "clearRequest" },
      { kind: "go", screen: "explore" },
      { kind: "fadeToBlack", ms: 700 },
      { kind: "starters", items: STARTERS_TRAIN },
      { kind: "openChat" },
    ],
  },

  // T26 — She asks which Numa. Lumi asks the only question that matters.
  {
    id: "train-vibe",
    segmentIndex: 5,
    background: STAGE,
    steps: [
      { kind: "userMsg", text: "which Numa should I stay at in London?" },
      { kind: "lumiTyping", ms: 1000 },
      {
        kind: "lumiMsg",
        text: "London in November — nice. What's the vibe?",
        widget: {
          type: "quickReply",
          data: {
            options: ["Buzzy and central", "Quiet, near a park", "Somewhere I can work", "Surprise me"],
          },
        },
      },
    ],
  },

  // T27 — Three of our London properties slide in, with a line about why these
  // three, for her. Booking her way back, on the train home from us.
  {
    id: "train-london",
    segmentIndex: 5,
    background: STAGE,
    steps: [
      { kind: "tapReply", text: "Quiet, near a park" },
      { kind: "lumiTyping", ms: 1100 },
      {
        kind: "lumiMsg",
        text: "Three for you, Sarah — all a short walk from green:",
        widget: {
          type: "propertyCarousel",
          data: {
            items: [
              {
                name: "Native Hyde Park by Numa",
                location: "Nearest to a quiet park",
                image: "/allhands/prop-hydepark.png",
              },
              {
                name: "Numa London Chelsea Green",
                location: "Leafy streets, minutes from the river",
                image: IMG.propLondon,
              },
              {
                name: "Numa London Bloomsbury",
                location: "Garden squares, still central",
                image: "/allhands/prop-bloomsbury.png",
              },
            ],
          },
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // T28 — End card
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "end",
    segmentIndex: 6,
    background: STAGE,
    thesisCard: true,
    steps: [
      { kind: "closeChat" },
      { kind: "surface", value: "app" },
      { kind: "go", screen: "explore" },
    ],
  },
];
