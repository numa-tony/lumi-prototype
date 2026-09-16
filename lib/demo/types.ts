// Shared Story Mode types.
//
// Extracted from story.ts so more than one story can be scripted against the
// same engine ("Sarah's Day" and the All-Hands walkthrough). The Step union is
// the engine's whole vocabulary — every kind here must be handled in
// storyRunner.applyStep (enforced by an exhaustiveness guard).

import type { ScreenId, WidgetData } from "@/lib/types";
import type { SmartRoomDevices } from "@/lib/smartRoom";

// What the phone frame is showing. "app" = the Numa app (default); the others
// are full-frame surfaces that sit above it (WhatsApp, iOS home, iOS lock).
export type PhoneSurface = "app" | "whatsapp" | "home" | "lock";

// ── Photographic stage ────────────────────────────────────────────────────────
// Stories with `stage: "photos"` play in front of photographs instead of the
// illustrated room. The photo and who owns the stage — the room or the phone —
// are separate axes: the room can change behind the phone, and focus can change
// without the room changing. See docs/project/story-mode.md.

export type StagePhotoId = "ac" | "blinds-closed" | "blinds-open" | "sunday" | "train";
// How one photo gives way to the next.
//   cut       instant
//   dissolve  crossfade with a slow scale settle — time passing in one place
//   night     dip to black, swap in the dark, rise — a night going by
//   part      the new photo opens outward from the curtain seam
//   travel    the old place drifts away as the new one arrives from the side
export type StageVia = "cut" | "dissolve" | "night" | "part" | "travel";
// scene: the photo owns the stage and the phone is below the frame.
// phone: the phone owns it; the photo sinks behind a tinted scrim and a blur.
export type StageFocus = "scene" | "phone";
// The time-and-place line shown while a scene is being introduced.
export interface StageStamp { when: string; where?: string }
// One-shot accents across the photo, for moments the room reacts to.
export type StagePulse = "cool";

// ── Step types ────────────────────────────────────────────────────────────────
// Each Step is one atomic action in a beat's sequence.
// Convention: the FIRST step of each beat is Sarah's action (what the player
// triggers by pressing →). Subsequent steps are Lumi/world auto-reactions.

export type Step =
  // In-app Lumi
  | { kind: "openChat" }                               // FAB tap → sheet up (idle)
  | { kind: "closeChat" }                              // close sheet AND wipe the thread
  | { kind: "hideChat" }                               // close sheet, KEEP the thread
  | { kind: "showChat" }                               // re-open sheet on the kept thread
  | { kind: "userMsg"; text: string }                  // typewriter → send → user bubble
  | { kind: "tapReply"; text: string }                 // instant tap on a quick-reply chip (no typewriter)
  | { kind: "openThread"; id: string }                 // open a seeded thread in storyChat
  | { kind: "lumiTyping"; ms?: number }                // typing dots for ms (default 1200)
  | { kind: "lumiMsg"; text?: string; widget?: WidgetData }   // append Lumi bubble/widget
  | { kind: "divider"; label: string }                 // date divider inside the thread
  | { kind: "starters"; items: string[] }              // starters shown on the idle "Ask Lumi" screen
  // Scripted voice mode (mimics VoiceSheet — no mic / no live AI)
  | { kind: "voiceOpen" }                              // slide the voice sheet up
  | { kind: "voiceClose" }
  | { kind: "voiceListen"; text: string }              // "listening" — waveform + transcript types out + TTS
  | { kind: "voiceRespond"; text: string }             // "speaking" — Lumi confirmation
  // Phone surfaces outside the app
  | { kind: "surface"; value: PhoneSurface }           // whatsapp / home / lock / back to app
  | { kind: "island"; expanded: boolean }              // Dynamic Island compact ⇄ expanded
  | { kind: "waUserMsg"; text: string; time?: string } // WhatsApp: Sarah types + sends
  | { kind: "waTyping"; ms?: number }
  | { kind: "waLumiMsg"; text: string; link?: string; time?: string }
  // Live service request (pinned card + Dynamic Island + lock-screen activity)
  | { kind: "startRequest" }                           // anchors the countdown to now
  | { kind: "clearRequest" }
  // World / room
  | { kind: "scene"; patch: Partial<SmartRoomDevices> }       // room device change
  | { kind: "breakout"; value: boolean }               // SmartRoomScene visibility
  | { kind: "frontDoor"; open: boolean | null }         // null=hidden, false=visible+closed, true=open
  | { kind: "fadeToBlack"; ms?: number }               // backdrop overlay fade (default 600)
  | { kind: "setInStay"; value: boolean }
  | { kind: "stayVisible"; value: boolean }            // show/hide the story's stay on Explore + My Trips
  // Photographic stage (stories with `stage: "photos"`)
  | { kind: "backdrop"; photo: StagePhotoId; via?: StageVia }  // change the photo (default: dissolve)
  | { kind: "focus"; mode: StageFocus; stamp?: StageStamp }     // hand the stage to the room or the phone
  | { kind: "glance"; ms?: number }                             // lift the scrim while the room changes
  | { kind: "pulse"; name: StagePulse }                         // a one-shot accent on the photo
  | { kind: "clearThreads" }
  | { kind: "loadThread"; id: string }
  | { kind: "go"; screen: ScreenId }
  | { kind: "wait"; ms: number };

// ── Segment metadata ──────────────────────────────────────────────────────────
// Narrative beats shown in the progress rail. Each PressBeat belongs to one.

export interface Segment {
  id: string;
  label: string;
}

// ── PressBeat ─────────────────────────────────────────────────────────────────
// Each entry = one → key press. Steps execute in order, with delays between them.

export type SarahEmotion = "neutral" | "happy" | "annoyed" | "content" | "surprised";

export interface PressBeat {
  id: string;
  segmentIndex: number;  // index into the story's segments — drives progress rail
  background: string;    // CSS background (transitions smoothly)
  narration?: string;    // yellow caption top-left
  sarah?: string;        // speech bubble bottom-left
  sarahEmotion?: SarahEmotion;
  titleCard?: boolean;
  thesisCard?: boolean;
  steps: Step[];         // executed in order when this beat plays
}

// ── Story ─────────────────────────────────────────────────────────────────────

export type StoryChrome =
  // "full" — Sarah's Day: progress rail, narration captions, Sarah bubbles,
  // beat counter, keycap hints. Built for watching on your own.
  | "full"
  // "bare" — All-Hands: just the phone and an exit affordance. The presenter is
  // the narration, so nothing on stage competes with them.
  | "bare";

export interface Story {
  id: string;
  label: string;        // sidebar entry
  title: string;        // title-card headline
  endTitle: string;     // end-card headline
  endSubtitle?: string;
  duration?: string;    // shown on the title card (full chrome only)
  chrome: StoryChrome;
  // The phone surface the story opens on, applied the moment it starts so the
  // first frame is already the right one.
  initialSurface: PhoneSurface;
  // Whether the illustrated world scenes behind the phone (the room, the front
  // door) are mounted for this story. Sarah's Day only — All-Hands plays in
  // front of photographs instead (`stage`, below).
  scenes: boolean;
  // "photos": play in front of the photographic stage (components/demo/stage),
  // driven by backdrop / focus / glance / pulse steps.
  stage?: "photos";
  segments: Segment[];
  beats: PressBeat[];
}
