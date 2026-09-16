import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import type { ChatContext, PersistedThread, ScreenId } from "./types";
import { demoSeedThreads, demoSeedThread } from "./mock/threads";
import { INITIAL_SMART_ROOM, type SmartRoomDevices } from "./smartRoom";
import type { PhoneSurface, StageFocus, StagePhotoId, StagePulse, StageStamp, StageVia } from "./demo/types";
import { createAcRequest, type RequestState } from "./demo/request";
import { getStory } from "./demo/stories";

// ── TV Shader params ───────────────────────────────────────────────────────────
export interface TvShaderParams {
  bgColor: string;    // hex — background
  dotColor: string;   // hex — dot color
  cellSize: number;   // CSS px per cell
  minDot: number;     // smallest dot half-extent (0–0.45)
  maxDot: number;     // largest dot half-extent (0.1–0.5)
  density: number;    // FBM scale (0.5–10)
  contrast: number;   // noise contrast multiplier (0–2)
  secMix: number;     // secondary FBM blend (0–1)
  speed: number;      // animation time scale (0–0.15)
}

export const DEFAULT_TV_SHADER: TvShaderParams = {
  bgColor: "#ffc9d2",
  dotColor: "#6060ee",
  cellSize: 12,
  minDot: 0.07,
  maxDot: 0.44,
  density: 3.2,
  contrast: 1.15,
  secMix: 0.45,
  speed: 0.030,
};

const STORAGE_KEY = "lumi-session-v1";

export interface StoryChatState {
  messages: UIMessage[];
  draft: string;       // typewriter text in input while she "types"
  lumiTyping: boolean; // show Lumi typing dots
  // The quick-reply option currently under her finger. Story Mode holds this
  // for a beat before the reply lands, so the audience sees the tap that
  // produced it rather than a bubble appearing from nowhere.
  tappedReply: string | null;
}

// Scripted voice-mode overlay for Story Mode (mimics VoiceSheet, no mic / no live AI)
export interface StoryVoiceState {
  open: boolean;
  mode: "idle" | "listening" | "speaking";
  transcript: string;  // her words, appearing word-by-word as if transcribed live
  response: string;    // Lumi's spoken confirmation
}

// ── The photographic stage (stories with `stage: "photos"`) ──────────────────
export interface StageState {
  photo: StagePhotoId | null;
  // The photo being left behind. It waits underneath, whole, while the new one
  // enters over it — so a dissolve never dips through black.
  prevPhoto: StagePhotoId | null;
  via: StageVia;
  // Bump on every backdrop change. `seq` keys the entering photo so its
  // entrance always plays from the start (even re-entering the same photo for a
  // time-skip); `prevSeq` keys the one underneath, so it keeps its DOM node and
  // never re-decodes.
  seq: number;
  prevSeq: number;
  focus: StageFocus;
  // Kept once the phone takes over, so the line fades out with its words still
  // in it instead of blanking first.
  stamp: StageStamp | null;
  glance: boolean;
  dip: boolean;
  pulse: { name: StagePulse; seq: number } | null;
  // Set while a backwards snap replays the story: the end state renders with
  // every transition off, and nothing that mounts during it animates later.
  instant: boolean;
}

export const INITIAL_STAGE: StageState = {
  photo: null,
  prevPhoto: null,
  via: "cut",
  seq: 0,
  prevSeq: 0,
  focus: "scene",
  stamp: null,
  glance: false,
  dip: false,
  pulse: null,
  instant: false,
};

export interface DemoState {
  active: boolean;
  // Which script is running — a key into STORIES (lib/demo/stories.ts).
  // "sarah" = Sarah's Day, "allhands" = the All-Hands walkthrough.
  storyId: string;
  beatIndex: number;
  roomBreakout: boolean;
  frontDoor: boolean | null; // null = hidden, false = visible+closed, true = visible+open
  fade: boolean;
  storyChat: StoryChatState;
  storyVoice: StoryVoiceState;
  // What the phone frame is showing. "app" = the Numa app; the rest are
  // full-frame surfaces (WhatsApp, iOS home screen, iOS lock screen).
  surface: PhoneSurface;
  islandExpanded: boolean;
  waChat: StoryChatState;
  request: RequestState | null;
  // Starters listed on the idle "Ask Lumi" screen — set per beat so Lumi always
  // offers something worth asking from where she's standing.
  starters: string[];
  // Whether the story's stay shows on Explore / My Trips (false on the train home).
  stayVisible: boolean;
  stage: StageState;
}

const EMPTY_STORY_CHAT: StoryChatState = { messages: [], draft: "", lumiTyping: false, tappedReply: null };
const EMPTY_STORY_VOICE: StoryVoiceState = { open: false, mode: "idle", transcript: "", response: "" };

const INITIAL_DEMO: DemoState = {
  active: false,
  storyId: "sarah",
  beatIndex: 0,
  roomBreakout: false,
  frontDoor: null,
  fade: false,
  storyChat: EMPTY_STORY_CHAT,
  storyVoice: EMPTY_STORY_VOICE,
  surface: "app",
  islandExpanded: false,
  waChat: EMPTY_STORY_CHAT,
  request: null,
  starters: [],
  stayVisible: true,
  stage: INITIAL_STAGE,
};

interface AppState {
  screen: ScreenId;
  tripId: string | null;
  chat: ChatContext | null;
  voiceOpen: boolean;
  bookingOpen: boolean;
  inStay: boolean;
  smartRoom: SmartRoomDevices;
  threads: PersistedThread[];
  tvShader: TvShaderParams;
  demo: DemoState;

  go: (screen: ScreenId) => void;
  openTrip: (tripId: string) => void;
  openChat: (ctx: ChatContext) => void;
  closeChat: () => void;
  openVoice: () => void;
  closeVoice: () => void;
  openBooking: () => void;
  closeBooking: () => void;
  setInStay: (v: boolean) => void;
  setSmartRoom: (update: Partial<SmartRoomDevices>) => void;
  setTvShader: (update: Partial<TvShaderParams>) => void;

  // Story / demo mode
  startStory: (storyId?: string) => void;
  exitStory: () => void;
  nextBeat: () => void;
  prevBeat: () => void;
  setBeatIndex: (n: number) => void;
  setRoomBreakout: (v: boolean) => void;
  setFrontDoor: (v: boolean | null) => void;
  setFade: (v: boolean) => void;
  // Story chat — presentational (no live AI)
  openStoryChat: () => void;
  openStoryThread: (id: string) => void;   // load seeded thread into storyChat + open sheet
  setStoryTappedReply: (text: string | null) => void;  // hold a quick-reply chip pressed
  setStoryDraft: (text: string) => void;
  pushStoryUserMsg: (text: string) => void;
  setLumiTyping: (v: boolean) => void;
  pushStoryLumiMsg: (text?: string, widget?: import("./types").WidgetData) => void;
  clearStoryChat: () => void;

  // Story voice mode — presentational (scripted, no mic / no live AI)
  openStoryVoice: () => void;
  closeStoryVoice: () => void;
  setStoryVoiceMode: (m: StoryVoiceState["mode"]) => void;
  setStoryVoiceTranscript: (t: string) => void;
  setStoryVoiceResponse: (t: string) => void;

  // Story surfaces + the live request (All-Hands walkthrough)
  hideStoryChat: () => void;   // close the sheet, keep the thread
  showStoryChat: () => void;   // re-open the sheet on the kept thread
  pushStoryDivider: (label: string) => void;
  setStoryStarters: (items: string[]) => void;
  setStorySurface: (surface: PhoneSurface) => void;
  setIslandExpanded: (v: boolean) => void;
  setWaDraft: (text: string) => void;
  pushWaUserMsg: (text: string, time?: string) => void;
  setWaTyping: (v: boolean) => void;
  pushWaLumiMsg: (text: string, link?: string, time?: string) => void;
  clearWaChat: () => void;
  startRequest: () => void;
  clearRequest: () => void;
  setStayVisible: (v: boolean) => void;
  // The photographic stage
  setStageBackdrop: (photo: StagePhotoId, via: StageVia) => void;
  setStageFocus: (focus: StageFocus, stamp?: StageStamp) => void;
  setStageGlance: (v: boolean) => void;
  setStageDip: (v: boolean) => void;
  pulseStage: (name: StagePulse) => void;
  setStageInstant: (v: boolean) => void;
  resetStage: () => void;

  createThread: (firstUserText: string) => string;
  saveThreadMessages: (id: string, messages: UIMessage[]) => void;
  renameThread: (id: string, topic: string, emoji?: string) => void;
  markRead: (id: string) => void;
  resetSession: () => void;
  loadDemoData: () => void;
  clearThreads: () => void;
  loadThread: (id: string) => void;
}

function truncateTopic(text: string, max = 40): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed || "New conversation";
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: "explore",
      tripId: null,
      chat: null,
      voiceOpen: false,
      bookingOpen: false,
      inStay: false,
      smartRoom: INITIAL_SMART_ROOM,
      tvShader: DEFAULT_TV_SHADER,
      threads: [],
      demo: INITIAL_DEMO,

      go: (screen) => set({ screen }),
      openTrip: (tripId) => set({ screen: "tripDetail", tripId }),
      openChat: (ctx) => {
        set({ chat: ctx });
        if (ctx.threadId) get().markRead(ctx.threadId);
      },
      closeChat: () => set({ chat: null }),
      openVoice: () => set({ voiceOpen: true }),
      closeVoice: () => set({ voiceOpen: false }),
      openBooking: () => set({ bookingOpen: true }),
      closeBooking: () => set({ bookingOpen: false }),
      setInStay: (v) => set({ inStay: v }),
      setTvShader: (update) => set((s) => ({ tvShader: { ...s.tvShader, ...update } })),

      startStory: (storyId = "sarah") => set(() => ({
        // Open on the story's own surface, so the first painted frame is
        // already right — no flash of the app before beat 0 runs.
        demo: {
          ...INITIAL_DEMO,
          active: true,
          storyId,
          frontDoor: false,
          surface: getStory(storyId).initialSurface,
        },
      })),
      exitStory: () => set((s) => ({
        demo: { ...INITIAL_DEMO, storyId: s.demo.storyId },
        // Reset the world the story mutated so "Back to main" lands on a clean app,
        // not the dark climax room (lights off, Netflix on, evening sky).
        chat: null,
        voiceOpen: false,
        inStay: false,
        smartRoom: INITIAL_SMART_ROOM,
        screen: "explore",
        // Drop the demo threads the story seeded into the inbox (keep any live
        // threads the user created themselves).
        threads: s.threads.filter((t) => t.source !== "demo"),
      })),
      nextBeat: () => set((s) => ({ demo: { ...s.demo, beatIndex: s.demo.beatIndex + 1 } })),
      prevBeat: () => set((s) => ({
        demo: { ...s.demo, beatIndex: Math.max(s.demo.beatIndex - 1, 0) },
      })),
      setBeatIndex: (n) => set((s) => ({ demo: { ...s.demo, beatIndex: n } })),
      setRoomBreakout: (v) => set((s) => ({ demo: { ...s.demo, roomBreakout: v } })),
      setFrontDoor: (v) => set((s) => ({ demo: { ...s.demo, frontDoor: v } })),
      setFade: (v) => set((s) => ({ demo: { ...s.demo, fade: v } })),

      openStoryChat: () => {
        set((s) => ({
          demo: { ...s.demo, storyChat: EMPTY_STORY_CHAT },
          chat: { kind: "stay", title: "Lumi" },
        }));
      },
      openStoryThread: (id) => {
        const thread = demoSeedThread(id);
        if (!thread) return;
        set((s) => ({
          demo: { ...s.demo, storyChat: { ...EMPTY_STORY_CHAT, messages: thread.messages } },
          chat: { kind: "thread", title: thread.topic, threadId: id, hint: thread.hint },
        }));
      },
      setStoryDraft: (text) =>
        set((s) => ({ demo: { ...s.demo, storyChat: { ...s.demo.storyChat, draft: text } } })),
      setStoryTappedReply: (text) =>
        set((s) => ({ demo: { ...s.demo, storyChat: { ...s.demo.storyChat, tappedReply: text } } })),
      pushStoryUserMsg: (text) => {
        const msg: UIMessage = {
          id: `story_u_${nanoid(6)}`,
          role: "user",
          parts: [{ type: "text", text }],
        };
        set((s) => ({
          demo: {
            ...s.demo,
            storyChat: {
              ...s.demo.storyChat,
              draft: "",
              tappedReply: null,
              messages: [...s.demo.storyChat.messages, msg],
            },
          },
        }));
      },
      setLumiTyping: (v) =>
        set((s) => ({ demo: { ...s.demo, storyChat: { ...s.demo.storyChat, lumiTyping: v } } })),
      pushStoryLumiMsg: (text, widget) => {
        const parts: UIMessage["parts"] = [];
        if (text) parts.push({ type: "text", text });
        if (widget) {
          parts.push({
            type: `tool-${widget.type}`,
            toolCallId: `story_w_${nanoid(6)}`,
            state: "output-available",
            input: {},
            output: widget.data,
          } as unknown as UIMessage["parts"][number]);
        }
        const msg: UIMessage = { id: `story_l_${nanoid(6)}`, role: "assistant", parts };
        set((s) => ({
          demo: {
            ...s.demo,
            storyChat: {
              ...s.demo.storyChat,
              lumiTyping: false,
              messages: [...s.demo.storyChat.messages, msg],
            },
          },
        }));
      },
      clearStoryChat: () =>
        set((s) => ({
          demo: { ...s.demo, storyChat: EMPTY_STORY_CHAT },
          chat: null,
        })),

      openStoryVoice: () =>
        set((s) => ({
          demo: { ...s.demo, storyVoice: { open: true, mode: "idle", transcript: "", response: "" } },
        })),
      closeStoryVoice: () =>
        set((s) => ({
          demo: { ...s.demo, storyVoice: { open: false, mode: "idle", transcript: "", response: "" } },
        })),
      setStoryVoiceMode: (mode) =>
        set((s) => ({ demo: { ...s.demo, storyVoice: { ...s.demo.storyVoice, mode } } })),
      setStoryVoiceTranscript: (transcript) =>
        set((s) => ({ demo: { ...s.demo, storyVoice: { ...s.demo.storyVoice, transcript } } })),
      setStoryVoiceResponse: (response) =>
        set((s) => ({ demo: { ...s.demo, storyVoice: { ...s.demo.storyVoice, response } } })),

      // ── Story surfaces + live request ──────────────────────────────────────

      // Close the sheet but keep the thread, so re-opening later (from the
      // Live Activity, or the inbox) lands back in the same conversation.
      hideStoryChat: () => set({ chat: null }),
      showStoryChat: () => set({ chat: { kind: "stay", title: "Lumi" } }),

      pushStoryDivider: (label) => {
        const msg: UIMessage = {
          id: `story_d_${nanoid(6)}`,
          role: "assistant",
          parts: [{ type: "story-divider", text: label } as unknown as UIMessage["parts"][number]],
        };
        set((s) => ({
          demo: {
            ...s.demo,
            storyChat: { ...s.demo.storyChat, messages: [...s.demo.storyChat.messages, msg] },
          },
        }));
      },

      setStoryStarters: (items) => set((s) => ({ demo: { ...s.demo, starters: items } })),
      setStorySurface: (surface) =>
        set((s) => ({
          // Leaving the home/lock screens always collapses the island again.
          demo: { ...s.demo, surface, islandExpanded: surface === "home" ? s.demo.islandExpanded : false },
        })),
      setIslandExpanded: (v) => set((s) => ({ demo: { ...s.demo, islandExpanded: v } })),

      setWaDraft: (text) =>
        set((s) => ({ demo: { ...s.demo, waChat: { ...s.demo.waChat, draft: text } } })),
      pushWaUserMsg: (text, time) => {
        const msg: UIMessage = {
          id: `wa_u_${nanoid(6)}`,
          role: "user",
          parts: [{ type: "text", text }, ...(time ? [{ type: "story-time", text: time } as unknown as UIMessage["parts"][number]] : [])],
        };
        set((s) => ({
          demo: {
            ...s.demo,
            waChat: { ...s.demo.waChat, draft: "", messages: [...s.demo.waChat.messages, msg] },
          },
        }));
      },
      setWaTyping: (v) =>
        set((s) => ({ demo: { ...s.demo, waChat: { ...s.demo.waChat, lumiTyping: v } } })),
      pushWaLumiMsg: (text, link, time) => {
        const parts: UIMessage["parts"] = [{ type: "text", text }];
        if (link) parts.push({ type: "story-link", text: link } as unknown as UIMessage["parts"][number]);
        if (time) parts.push({ type: "story-time", text: time } as unknown as UIMessage["parts"][number]);
        const msg: UIMessage = { id: `wa_l_${nanoid(6)}`, role: "assistant", parts };
        set((s) => ({
          demo: {
            ...s.demo,
            waChat: { ...s.demo.waChat, lumiTyping: false, messages: [...s.demo.waChat.messages, msg] },
          },
        }));
      },
      clearWaChat: () => set((s) => ({ demo: { ...s.demo, waChat: EMPTY_STORY_CHAT } })),

      startRequest: () => set((s) => ({ demo: { ...s.demo, request: createAcRequest() } })),
      clearRequest: () => set((s) => ({ demo: { ...s.demo, request: null } })),
      setStayVisible: (v) => set((s) => ({ demo: { ...s.demo, stayVisible: v } })),

      // ── The photographic stage ─────────────────────────────────────────────
      setStageBackdrop: (photo, via) =>
        set((s) => {
          const st = s.demo.stage;
          const same = st.photo === photo;
          return {
            demo: {
              ...s.demo,
              stage: {
                ...st,
                // Re-entering the same photo keeps whatever was underneath it.
                prevPhoto: same ? st.prevPhoto : st.photo,
                prevSeq: same ? st.prevSeq : st.seq,
                photo,
                via,
                seq: st.seq + 1,
              },
            },
          };
        }),
      setStageFocus: (focus, stamp) =>
        set((s) => ({
          demo: {
            ...s.demo,
            stage: {
              ...s.demo.stage,
              focus,
              // A scene brings its own line (or none); the phone keeps the
              // last one so it can fade out whole.
              stamp: focus === "scene" ? (stamp ?? null) : s.demo.stage.stamp,
            },
          },
        })),
      setStageGlance: (v) => set((s) => ({ demo: { ...s.demo, stage: { ...s.demo.stage, glance: v } } })),
      setStageDip: (v) => set((s) => ({ demo: { ...s.demo, stage: { ...s.demo.stage, dip: v } } })),
      pulseStage: (name) =>
        set((s) => ({
          demo: {
            ...s.demo,
            stage: { ...s.demo.stage, pulse: { name, seq: (s.demo.stage.pulse?.seq ?? 0) + 1 } },
          },
        })),
      setStageInstant: (v) => set((s) => ({ demo: { ...s.demo, stage: { ...s.demo.stage, instant: v } } })),
      resetStage: () => set((s) => ({ demo: { ...s.demo, stage: INITIAL_STAGE } })),

      setSmartRoom: (update) =>
        set((s) => ({
          smartRoom: {
            ...s.smartRoom,
            ...update,
            door:   update.door   ? { ...s.smartRoom.door,   ...update.door }   : s.smartRoom.door,
            lights: update.lights ? { ...s.smartRoom.lights, ...update.lights } : s.smartRoom.lights,
            tv:     update.tv     ? { ...s.smartRoom.tv,     ...update.tv }     : s.smartRoom.tv,
            blinds: update.blinds ? { ...s.smartRoom.blinds, ...update.blinds } : s.smartRoom.blinds,
            ac:     update.ac     ? { ...s.smartRoom.ac,     ...update.ac }     : s.smartRoom.ac,
            lastChangedAt: Date.now(),
          },
        })),

      createThread: (firstUserText) => {
        const id = `th_${nanoid(8)}`;
        const now = Date.now();
        const next: PersistedThread = {
          id,
          topic: truncateTopic(firstUserText),
          emoji: "💬",
          filter: "support",
          state: "active",
          messages: [],
          createdAt: now,
          updatedAt: now,
          source: "live",
        };
        set((s) => ({ threads: [next, ...s.threads] }));
        return id;
      },

      saveThreadMessages: (id, messages) =>
        set((s) => ({
          threads: s.threads.map((t) => {
            if (t.id !== id) return t;
            // Continuing a demo thread for the first time? Drop the hand-crafted
            // preview/time overrides so the inbox row reflects the new live turn.
            const grew = messages.length > t.messages.length;
            return grew
              ? { ...t, messages, updatedAt: Date.now(), preview: undefined, time: undefined }
              : { ...t, messages, updatedAt: Date.now() };
          }),
        })),

      renameThread: (id, topic, emoji) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id
              ? { ...t, topic: topic || t.topic, emoji: emoji || t.emoji }
              : t,
          ),
        })),

      markRead: (id) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id && t.unread ? { ...t, unread: false } : t,
          ),
        })),

      resetSession: () => {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            // ignore — privacy mode etc.
          }
        }
        set({
          screen: "explore",
          tripId: null,
          chat: null,
          voiceOpen: false,
          bookingOpen: false,
          smartRoom: INITIAL_SMART_ROOM,
          threads: [],
        });
      },

      loadDemoData: () => {
        const demo = demoSeedThreads();
        // Replace existing demo threads, keep any live ones the user created.
        set((s) => ({
          threads: [...demo, ...s.threads.filter((t) => t.source === "live")],
        }));
      },
      clearThreads: () => set({ threads: [] }),
      loadThread: (id) => {
        const thread = demoSeedThread(id);
        if (!thread) return;
        set((s) => ({
          threads: s.threads.some((t) => t.id === id)
            ? s.threads
            : [thread, ...s.threads],
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only threads survive across reloads. screen/chat/tripId stay ephemeral
      // so refreshing always lands you on a clean Explore with no open sheet.
      partialize: (s) => ({ threads: s.threads, inStay: s.inStay, tvShader: s.tvShader }),
    },
  ),
);

// Dev-only handle on the store, so the running app can be inspected and driven
// from the browser console (and by automated checks) without wiring debug UI.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __lumi?: typeof useApp }).__lumi = useApp;
}

// Contextual Lumi entry points per screen — the FAB conversation adapts to where
// the guest is, per the UX vision doc.
export const CHAT_CONTEXTS: Record<string, ChatContext> = {
  explore: {
    kind: "explore",
    title: "Lumi",
    hint: "The guest is browsing the Explore screen, not in an active stay-issue context. Help them discover destinations and Numa properties.",
    starters: [
      "Where should I go this summer?",
      "Find me a quiet city break",
      "What makes Numa different?",
    ],
  },
  stay: {
    kind: "stay",
    title: "Lumi",
    hint: "The guest opened Lumi from their current stay at Numa Berlin Novela (room 204). Default to in-stay help: amenities, service requests, local recommendations.",
    starters: [
      "How do I use the AC?",
      "Any good ramen near here?",
      "I need extra towels",
      "What time is checkout?",
    ],
  },
  property: {
    kind: "property",
    title: "Lumi",
    hint: "The guest is viewing a Numa property page for a prospective booking. Help with booking research: what's included, comparisons, availability.",
    starters: [
      "Is this property family-friendly?",
      "What's included?",
      "Compare to similar properties",
    ],
  },
};
