import type { PressBeat, Segment, StageStamp } from "./types";
import { IMG } from "@/lib/mock/properties";

// ─────────────────────────────────────────────────────────────────────────────
// "It started with an air conditioner." — the All-Hands walkthrough.
//
// Scripted from Lumi All-Hands — Script & Run-of-Show (Draft 2). One → press per
// entry below; the presenter is the narration, so the stage carries no captions.
// Everything is canned: no live AI, no TTS, no mic, no network.
//
// The stage is photographic (components/demo/stage, `stage: "photos"`): five
// photographs of the Berlin room and the train home, and two focus modes. When
// a new place or time arrives, the phone leaves the frame and the room owns the
// stage, stamped with the time; the next press brings the phone back up on top,
// with the room dimmed and blurred behind it. Room changes still flow through
// `scene` steps — the Friday photo's lights follow `smartRoom.lights.on`.
// Presenter reference: docs/project/all-hands-story.md.
// ─────────────────────────────────────────────────────────────────────────────

const STAGE = "#000000";

// The stamps shown while a scene is introduced. Twelve-hour, to match the
// times already in the chat and on WhatsApp ("9:39 PM", "8:14 AM").
const FRIDAY: StageStamp = { when: "Friday, 9:39 PM", where: "Berlin · Friedrichshain" };
const SATURDAY: StageStamp = { when: "Saturday, 8:14 AM", where: "Berlin · Friedrichshain" };
const SUNDAY: StageStamp = { when: "Sunday, 9:20 AM", where: "Berlin · Friedrichshain" };
const TRAIN: StageStamp = { when: "Sunday, 3:10 PM", where: "Leaving Berlin" };

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
  // T0 — Opening frame: the room, not the phone — Friday night, shown as
  // photographed, the thermostat reading 26 °C. The phone is below the frame;
  // the presenter opens the story, and the next press brings it up. From that
  // press on, the story's lights-off state dims the room behind the phone.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "title",
    segmentIndex: 0,
    background: STAGE,
    titleCard: true,
    steps: [
      // The room first, so the very first frame is already the right one.
      { kind: "backdrop", photo: "ac", via: "cut" },
      { kind: "focus", mode: "scene", stamp: FRIDAY },
      // WhatsApp first on the phone, so the reset below happens behind it and
      // the phone never rises on a flash of the app.
      { kind: "surface", value: "whatsapp" },
      { kind: "clearThreads" },
      { kind: "clearRequest" },
      { kind: "setInStay", value: true },
      { kind: "stayVisible", value: true },
      { kind: "breakout", value: false },
      { kind: "frontDoor", open: null },
      { kind: "closeChat" },
      { kind: "starters", items: STARTERS_ROOM },
      { kind: "go", screen: "explore" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 01 — The room won't cool down
  // ══════════════════════════════════════════════════════════════════════════

  // The phone rises onto the room — an empty WhatsApp thread with Numa.
  {
    id: "phone-rise",
    segmentIndex: 1,
    background: STAGE,
    steps: [{ kind: "focus", mode: "phone" }],
  },

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

  // T6 — Straight from the chat to the home screen: our logo, and the countdown,
  // at the top of her phone. The chat sheet stays open underneath the home and
  // lock surfaces, so tapping the widget (T9) lands straight back in it.
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

  // T10 — Out to the inbox. One thing in it, because she's only asked us one thing.
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
      // Behind the phone, a breath of cool air crosses the room.
      { kind: "clearRequest" },
      { kind: "pulse", name: "cool" },
      { kind: "starters", items: STARTERS_ROOM },
      { kind: "openChat" },
    ],
  },

  // T16 — "Hang on. Let me try something." She taps the third one. Behind the
  // phone the room brightens with the lights, and stays bright until T17.
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

  // T17 — No hunting for a switch in the dark. The room behind the phone dims.
  {
    id: "lights-off",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "userMsg", text: "turn off the lights" },
      { kind: "lumiTyping", ms: 800 },
      { kind: "scene", patch: { lights: { on: false, brightness: 0, warmth: "warm" } } },
      { kind: "lumiMsg", text: "Lights off 🌙" },
    ],
  },

  // The night goes by. The phone leaves; the room dips to black and comes back
  // up as Saturday morning — curtains still drawn, light leaking at the seam.
  // The chat's date divider is pushed here, while the phone is off-stage.
  {
    id: "saturday",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "focus", mode: "scene" },
      { kind: "backdrop", photo: "blinds-closed", via: "night" },
      { kind: "scene", patch: { windowSky: "morning" } },
      { kind: "divider", label: "Sat 11 Jul · 8:14 AM" },
      { kind: "focus", mode: "scene", stamp: SATURDAY },
    ],
  },

  // T18 — Next morning, from bed: open the blinds. And Berlin shows up — the
  // open room spreads outward from the seam where the light was leaking.
  {
    id: "blinds-morning",
    segmentIndex: 3,
    background: STAGE,
    steps: [
      { kind: "focus", mode: "phone" },
      { kind: "userMsg", text: "open the blinds" },
      { kind: "lumiTyping", ms: 800 },
      { kind: "glance", ms: 2600 },
      { kind: "backdrop", photo: "blinds-open", via: "part" },
      { kind: "scene", patch: { blinds: { position: 100 } } },
      { kind: "lumiMsg", text: "Blinds are open — good morning, Berlin ☀️" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BEAT 04 — Lunch, and twenty euros
  // ══════════════════════════════════════════════════════════════════════════

  // T19 — Lunchtime. She wants to eat somewhere good and has no idea where.
  // Same room, later: the photo dips and rises behind the phone.
  {
    id: "lunch-open",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
      { kind: "backdrop", photo: "blinds-open", via: "night" },
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

  // Sunday morning arrives. The sunrise starts dissolving in *behind* the phone,
  // and the phone's exit reveals it — so Saturday's room never shows, sharp, in
  // between. The phone resets to Explore while it's off-stage, so it rises
  // already where she'll be.
  {
    id: "sunday",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "backdrop", photo: "sunday", via: "dissolve" },
      { kind: "focus", mode: "scene" },
      { kind: "closeChat" },
      { kind: "go", screen: "explore" },
      { kind: "starters", items: STARTERS_CHECKOUT },
      { kind: "focus", mode: "scene", stamp: SUNDAY },
    ],
  },

  // T22 — The last question of the stay.
  {
    id: "checkout-open",
    segmentIndex: 4,
    background: STAGE,
    steps: [
      { kind: "focus", mode: "phone" },
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

  // The stay's over. The train window starts arriving *behind* the phone as the
  // room drifts away, and the phone's exit reveals it — straight from the phone
  // to the train, with no sharp look back at the room in between. Everything
  // about the stay clears while the phone is off-stage.
  {
    id: "train",
    segmentIndex: 5,
    background: STAGE,
    steps: [
      { kind: "backdrop", photo: "train", via: "travel" },
      { kind: "focus", mode: "scene" },
      { kind: "closeChat" },
      { kind: "stayVisible", value: false },
      { kind: "setInStay", value: false },
      { kind: "clearRequest" },
      { kind: "go", screen: "explore" },
      { kind: "starters", items: STARTERS_TRAIN },
      { kind: "focus", mode: "scene", stamp: TRAIN },
    ],
  },

  // T25 — Sunday afternoon, on the train. Nothing booked next.
  {
    id: "train-open",
    segmentIndex: 5,
    background: STAGE,
    steps: [
      { kind: "focus", mode: "phone" },
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
  // T28 — End card, over the train window, darkened
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "end",
    segmentIndex: 6,
    background: STAGE,
    thesisCard: true,
    steps: [
      { kind: "focus", mode: "scene" },
      { kind: "closeChat" },
      { kind: "surface", value: "app" },
      { kind: "go", screen: "explore" },
    ],
  },
];
