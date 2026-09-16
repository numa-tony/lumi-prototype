// Async step runner for Story Mode.
// Uses useApp.getState() directly (no React hooks) so it can run inside
// imperative async functions without re-render coupling.

import { useApp } from "@/lib/store";
import { beatsForStory } from "./stories";
import type { PressBeat, Step } from "./types";
import { INITIAL_SMART_ROOM } from "@/lib/smartRoom";

// The beats of whichever story is currently running (see lib/demo/stories.ts).
function beats(): PressBeat[] {
  return beatsForStory(useApp.getState().demo.storyId);
}

interface CancelToken { cancelled: boolean }

function sleep(ms: number, token: CancelToken): Promise<void> {
  return new Promise<void>((res) => setTimeout(res, ms)).then(() => {
    if (token.cancelled) throw new DOMException("cancelled", "AbortError");
  });
}

// ── Photographic stage timings ───────────────────────────────────────────────
// Mirrors of the CSS in app/globals.css (the .stage block). The runner only
// waits where the next step must not start before a move has landed.
const STAGE_RISE_MS = 950;   // the phone settles onto the stage
const STAGE_SINK_MS = 650;   // the phone clears the frame
const NIGHT_DOWN_MS = 700;   // into black
const NIGHT_HOLD_MS = 250;   // a held beat of dark before the new room rises
const GLANCE_IN_MS = 450;    // the scrim lifts before the room changes
const GLANCE_MS = 2200;      // from the lift to the start of the return
// Overlapping glances: only the newest one may end the glance.
let glanceSeq = 0;

// Speak Sarah's request aloud during the voice climax. Uses the same Kokoro
// provider as Lumi (/api/tts) but with a different, natural female voice
// (af_sarah) so she sounds distinct from Lumi (af_heart). Falls back to browser
// SpeechSynthesis, then silently no-ops — the visual showcase always lands.
let currentSarahAudio: HTMLAudioElement | null = null;

async function speakAsSarah(text: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "af_sarah" }),
    });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentSarahAudio = audio;
        // Wait until playback ends OR is stopped (pause fires when stopSpeaking() is called)
        await new Promise<void>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onpause = () => resolve();
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(() => resolve());
        });
        currentSarahAudio = null;
        return;
      }
    }
  } catch {
    /* Kokoro unavailable / autoplay blocked — fall back to browser TTS */
  }
  browserSpeakSarah(text);
}

function browserSpeakSarah(text: string): void {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Samantha") || v.name.includes("Ava") || /female/i.test(v.name)),
    );
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch {
    /* no TTS available */
  }
}

function stopSpeaking(): void {
  try {
    if (currentSarahAudio) {
      currentSarahAudio.pause();
      currentSarahAudio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  } catch { /* ignore */ }
}

// Apply a single step — either animated (with timing) or instant (no delays/typewriter).
async function applyStep(step: Step, token: CancelToken, animated: boolean): Promise<void> {
  const s = useApp.getState();

  switch (step.kind) {
    case "openChat":
      s.openStoryChat();
      break;

    case "closeChat":
      s.clearStoryChat();
      break;

    case "userMsg": {
      if (animated) {
        const text = step.text;
        const msPerChar = Math.min(42, 800 / text.length);
        try {
          for (let i = 1; i <= text.length; i++) {
            if (token.cancelled) throw new DOMException("cancelled", "AbortError");
            useApp.getState().setStoryDraft(text.slice(0, i));
            await sleep(msPerChar, token);
          }
          await sleep(180, token);
        } catch {
          // Cancelled mid-typewriter — return WITHOUT pushing. Whoever cancelled
          // (fast-forward, or a backward snap) owns what happens next; pushing
          // here as well is how the same message used to land twice when the
          // presenter advanced mid-type.
          return;
        }
      }
      useApp.getState().setStoryDraft("");
      useApp.getState().pushStoryUserMsg(step.text);
      break;
    }

    case "tapReply": {
      // She taps a quick-reply chip. Hold the chip pressed for a beat first —
      // without it the reply bubble just appears and the audience never sees
      // her make the choice.
      if (animated) {
        useApp.getState().setStoryTappedReply(step.text);
        try {
          await sleep(380, token);
        } catch {
          // Cancelled mid-press — release the chip and return WITHOUT pushing.
          // See userMsg: the canceller owns the push.
          useApp.getState().setStoryTappedReply(null);
          return;
        }
      }
      // pushStoryUserMsg releases the chip as the bubble lands.
      useApp.getState().pushStoryUserMsg(step.text);
      break;
    }

    case "hideChat":
      s.hideStoryChat();
      break;

    case "showChat":
      s.showStoryChat();
      break;

    case "openThread":
      useApp.getState().openStoryThread(step.id);
      break;

    case "divider":
      useApp.getState().pushStoryDivider(step.label);
      break;

    case "starters":
      useApp.getState().setStoryStarters(step.items);
      break;

    case "lumiTyping":
      s.setLumiTyping(true);
      if (animated) {
        try { await sleep(step.ms ?? 1200, token); } catch { /* cancelled — ok */ }
      }
      break;

    case "lumiMsg":
      useApp.getState().setLumiTyping(false);
      useApp.getState().pushStoryLumiMsg(step.text, step.widget);
      break;

    // ── Scripted voice mode ───────────────────────────────────────────────

    case "voiceOpen":
      stopSpeaking();
      useApp.getState().openStoryVoice();
      break;

    case "voiceClose":
      stopSpeaking();
      useApp.getState().closeStoryVoice();
      break;

    case "voiceListen": {
      const st = useApp.getState();
      st.setStoryVoiceMode("listening");
      st.setStoryVoiceResponse("");
      st.setStoryVoiceTranscript("");
      if (animated) {
        // Start TTS concurrently with transcript animation
        const speakPromise = speakAsSarah(step.text);
        // Type the transcript out word-by-word, as live STT would surface it.
        const words = step.text.split(" ");
        try {
          await sleep(450, token); // brief "listening" beat before words land
          for (let i = 1; i <= words.length; i++) {
            if (token.cancelled) throw new DOMException("cancelled", "AbortError");
            useApp.getState().setStoryVoiceTranscript(words.slice(0, i).join(" "));
            await sleep(190, token);
          }
          await sleep(350, token);
        } catch {
          // cancelled mid-transcription: fall through to the final state
        }
        // Wait for Sarah's voice to finish before Lumi responds.
        // Skip if cancelled — stopSpeaking() will be called by snapToBeat.
        if (!token.cancelled) await speakPromise;
      }
      useApp.getState().setStoryVoiceTranscript(step.text);
      break;
    }

    case "voiceRespond":
      stopSpeaking();
      useApp.getState().setStoryVoiceMode("speaking");
      useApp.getState().setStoryVoiceResponse(step.text);
      break;

    // ── Phone surfaces outside the app ────────────────────────────────────

    case "surface":
      useApp.getState().setStorySurface(step.value);
      break;

    case "island":
      useApp.getState().setIslandExpanded(step.expanded);
      break;

    case "waUserMsg": {
      if (animated) {
        const text = step.text;
        const msPerChar = Math.min(38, 900 / text.length);
        try {
          for (let i = 1; i <= text.length; i++) {
            if (token.cancelled) throw new DOMException("cancelled", "AbortError");
            useApp.getState().setWaDraft(text.slice(0, i));
            await sleep(msPerChar, token);
          }
          await sleep(200, token);
        } catch {
          return;   // see userMsg — the canceller owns the push
        }
      }
      useApp.getState().setWaDraft("");
      useApp.getState().pushWaUserMsg(step.text, step.time);
      break;
    }

    case "waTyping":
      s.setWaTyping(true);
      if (animated) {
        try { await sleep(step.ms ?? 1200, token); } catch { /* cancelled — ok */ }
      }
      break;

    case "waLumiMsg":
      useApp.getState().setWaTyping(false);
      useApp.getState().pushWaLumiMsg(step.text, step.link, step.time);
      break;

    // ── Live service request ──────────────────────────────────────────────

    case "startRequest":
      useApp.getState().startRequest();
      break;

    case "clearRequest":
      useApp.getState().clearRequest();
      break;

    // ── World / room ──────────────────────────────────────────────────────

    case "scene":
      useApp.getState().setSmartRoom(step.patch);
      break;

    case "breakout":
      useApp.getState().setRoomBreakout(step.value);
      break;

    case "frontDoor":
      useApp.getState().setFrontDoor(step.open);
      break;

    case "fadeToBlack": {
      const dur = step.ms ?? 600;
      useApp.getState().setFade(true);
      if (animated) {
        try { await sleep(dur, token); } catch { /* cancelled — still clear the fade */ }
      }
      useApp.getState().setFade(false);
      break;
    }

    case "setInStay":
      useApp.getState().setInStay(step.value);
      break;

    case "stayVisible":
      useApp.getState().setStayVisible(step.value);
      break;

    case "clearThreads":
      useApp.getState().clearThreads();
      break;

    case "loadThread":
      useApp.getState().loadThread(step.id);
      break;

    case "go":
      useApp.getState().go(step.screen);
      break;

    case "wait":
      if (animated) {
        try { await sleep(step.ms, token); } catch { /* cancelled */ }
      }
      break;

    // ── Photographic stage ────────────────────────────────────────────────

    case "backdrop": {
      const via = step.via ?? "dissolve";
      if (!animated) {
        // Snapping or fast-forwarding: land on the photo. A snap renders it
        // with transitions off; a fast-forward lets it finish arriving.
        useApp.getState().setStageDip(false);
        useApp.getState().setStageBackdrop(step.photo, via === "night" ? "dissolve" : via);
        break;
      }
      if (via !== "night") {
        useApp.getState().setStageBackdrop(step.photo, via);
        break;
      }
      // Night: down into black, swap while nothing is visible, a held beat of
      // dark, then the new room rises. Cancelled part-way, the canceller lands
      // it (see userMsg) — writing here too could end the next beat's dip.
      useApp.getState().setStageDip(true);
      try { await sleep(NIGHT_DOWN_MS, token); } catch { return; }
      useApp.getState().setStageBackdrop(step.photo, "cut");
      try { await sleep(NIGHT_HOLD_MS, token); } catch { return; }
      useApp.getState().setStageDip(false);
      break;
    }

    case "focus":
      useApp.getState().setStageFocus(step.mode, step.stamp);
      if (animated) {
        // Let the phone land (or leave) before the next step: typing must never
        // start under a phone that is still moving.
        try { await sleep(step.mode === "phone" ? STAGE_RISE_MS : STAGE_SINK_MS, token); } catch { /* state already set */ }
      }
      break;

    case "glance": {
      // A glance is a moment, not a state — there is nothing to snap to.
      if (!animated) {
        useApp.getState().setStageGlance(false);
        break;
      }
      const id = ++glanceSeq;
      useApp.getState().setStageGlance(true);
      // The return runs on a timer rather than being awaited, so the room
      // change that follows plays *inside* the glance instead of after it.
      setTimeout(() => {
        if (glanceSeq === id) useApp.getState().setStageGlance(false);
      }, step.ms ?? GLANCE_MS);
      try { await sleep(GLANCE_IN_MS, token); } catch { /* lifting either way */ }
      break;
    }

    case "pulse":
      // One-shot and decorative: never replayed by a snap or a fast-forward.
      if (animated) useApp.getState().pulseStage(step.name);
      break;

    default: {
      // Exhaustiveness guard — adding a Step kind without handling it here is a
      // compile error rather than a step that silently does nothing on stage.
      const never: never = step;
      throw new Error(`Unhandled story step: ${JSON.stringify(never)}`);
    }
  }
}

// ── Active playback state ────────────────────────────────────────────────────
let activeToken: CancelToken = { cancelled: false };

// Snap the store to the exact state that beat N produces — no animation,
// runs through beats 0..N applying every step instantly.
export async function snapToBeat(n: number): Promise<void> {
  // Cancel any beat still playing, so its remaining steps can't land on top of
  // the state we're about to snap to — pressing ← mid-beat has to be safe.
  activeToken.cancelled = true;
  // Full reset first
  stopSpeaking();
  const s = useApp.getState();
  s.clearStoryChat();
  s.closeStoryVoice();
  s.setFrontDoor(null);
  s.setFade(false);
  s.setRoomBreakout(false);
  s.setInStay(false);
  s.go("explore");
  s.clearThreads();
  s.setSmartRoom(INITIAL_SMART_ROOM);
  s.setStorySurface("app");
  s.setIslandExpanded(false);
  s.clearWaChat();
  s.clearRequest();
  s.setStoryStarters([]);
  s.setStayVisible(true);
  // The photographic stage replays to its end state with every transition off,
  // so ← lands instantly instead of animating back from wherever it was.
  glanceSeq++;
  s.resetStage();
  s.setStageInstant(true);

  const story = beats();
  const fakeToken: CancelToken = { cancelled: false };
  for (let i = 0; i <= n && i < story.length; i++) {
    for (const step of story[i].steps) {
      await applyStep(step, fakeToken, false);
    }
  }
  // Let the snapped frame paint with transitions off, then hand motion back.
  setTimeout(() => useApp.getState().setStageInstant(false), 80);
}

// Playback position, owned by the runner alone. A keydown closure can hold a
// stale beatIndex under rapid input, so fast-forward reads these rather than
// being told which beat it is on.
let currentStepIndex = 0;
let activeBeatIndex = -1;

// Play beat N with full animation. Cancels any running playback first.
export async function playBeat(n: number): Promise<void> {
  activeToken.cancelled = true;
  const token: CancelToken = { cancelled: false };
  activeToken = token;
  currentStepIndex = 0;
  activeBeatIndex = n;

  const beat = beats()[n];
  if (!beat) return;

  const REACTION_GAP = 160; // ms between consecutive reactions

  for (let i = 0; i < beat.steps.length; i++) {
    if (token.cancelled) return;

    currentStepIndex = i;

    // Small gap between reactions (skip before typing dots — they appear immediately)
    const kind = beat.steps[i].kind;
    if (i > 0 && kind !== "lumiTyping") {
      try { await sleep(REACTION_GAP, token); } catch { return; }
    }
    if (token.cancelled) return;

    try {
      await applyStep(beat.steps[i], token, true);
    } catch {
      return; // cancelled inside a step
    }
  }
}

// Fast-forward: cancel the running beat and apply its remaining steps instantly.
// Reads the runner's own position, so it can't act on a beat that isn't playing.
export function fastForwardCurrent(): void {
  const fromStep = currentStepIndex;
  const beat = beats()[activeBeatIndex];
  activeToken.cancelled = true;
  if (!beat) return;
  const fakeToken: CancelToken = { cancelled: false };
  for (let i = fromStep; i < beat.steps.length; i++) {
    applyStep(beat.steps[i], fakeToken, false);
  }
}
