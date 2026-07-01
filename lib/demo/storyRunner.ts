// Async step runner for Story Mode.
// Uses useApp.getState() directly (no React hooks) so it can run inside
// imperative async functions without re-render coupling.

import { useApp } from "@/lib/store";
import { STORY } from "./story";
import type { Step } from "./story";
import { INITIAL_SMART_ROOM } from "@/lib/smartRoom";

interface CancelToken { cancelled: boolean }

function sleep(ms: number, token: CancelToken): Promise<void> {
  return new Promise<void>((res) => setTimeout(res, ms)).then(() => {
    if (token.cancelled) throw new DOMException("cancelled", "AbortError");
  });
}

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
          // cancelled mid-typewriter: fall through to push the full message instantly
        }
      }
      useApp.getState().setStoryDraft("");
      useApp.getState().pushStoryUserMsg(step.text);
      break;
    }

    case "tapReply":
      // Instant tap — no typewriter, just push the message directly
      useApp.getState().pushStoryUserMsg(step.text);
      break;

    case "openThread":
      useApp.getState().openStoryThread(step.id);
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
  }
}

// Snap the store to the exact state that beat N produces — no animation,
// runs through beats 0..N applying every step instantly.
export async function snapToBeat(n: number): Promise<void> {
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

  const fakeToken: CancelToken = { cancelled: false };
  for (let i = 0; i <= n && i < STORY.length; i++) {
    for (const step of STORY[i].steps) {
      await applyStep(step, fakeToken, false);
    }
  }
}

// ── Active playback state ────────────────────────────────────────────────────
let activeToken: CancelToken = { cancelled: false };
// Index of the step currently being applied (or about to be applied)
// in the running playBeat. Used by fastForwardCurrent to skip already-applied steps.
let currentStepIndex = 0;

// Play beat N with full animation. Cancels any running playback first.
export async function playBeat(n: number): Promise<void> {
  activeToken.cancelled = true;
  const token: CancelToken = { cancelled: false };
  activeToken = token;
  currentStepIndex = 0;

  const beat = STORY[n];
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

// Fast-forward: cancel running beat and apply remaining unapplied steps instantly.
// Starts from currentStepIndex so already-completed steps aren't duplicated.
export function fastForwardCurrent(n: number): void {
  const fromStep = currentStepIndex;
  activeToken.cancelled = true;
  const fakeToken: CancelToken = { cancelled: false };
  const beat = STORY[n];
  if (!beat) return;
  for (let i = fromStep; i < beat.steps.length; i++) {
    applyStep(beat.steps[i], fakeToken, false);
  }
}
