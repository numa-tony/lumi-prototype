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

    // ── WA scripted conversation ──────────────────────────────────────────

    case "waUserMsg": {
      if (animated) {
        const text = step.text;
        const msPerChar = Math.min(42, 800 / text.length);
        try {
          for (let i = 1; i <= text.length; i++) {
            if (token.cancelled) throw new DOMException("cancelled", "AbortError");
            useApp.getState().setStoryWaDraft(text.slice(0, i));
            await sleep(msPerChar, token);
          }
          await sleep(180, token);
        } catch {
          // cancelled mid-typewriter: fall through to push the full message instantly
        }
      }
      useApp.getState().setStoryWaDraft("");
      useApp.getState().pushStoryWaUserMsg(step.text);
      break;
    }

    case "waLumiTyping":
      s.setStoryWaLumiTyping(true);
      if (animated) {
        try { await sleep(step.ms ?? 1200, token); } catch { /* cancelled — ok */ }
      }
      break;

    case "waLumiMsg":
      useApp.getState().setStoryWaLumiTyping(false);
      useApp.getState().pushStoryWaLumiMsg(step.text, step.widget);
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

    case "setWaEnabled":
      useApp.getState().setWaEnabled(step.value);
      break;

    case "resetWa":
      useApp.getState().resetWa();
      useApp.getState().clearStoryWa();
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
  const s = useApp.getState();
  s.clearStoryChat();
  s.clearStoryWa();
  s.setFrontDoor(null);
  s.setFade(false);
  s.setRoomBreakout(false);
  s.setInStay(false);
  s.setWaEnabled(false);
  s.go("explore");
  s.clearThreads();
  s.setSmartRoom(INITIAL_SMART_ROOM);
  s.resetWa();

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
    if (i > 0 && kind !== "lumiTyping" && kind !== "waLumiTyping") {
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
