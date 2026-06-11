import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import type { ChatContext, PersistedThread, ScreenId, ThreadFilter, WaState, WaTopicMarker } from "./types";
import { demoSeedThreads, demoSeedThread } from "./mock/threads";
import { INITIAL_SMART_ROOM, type SmartRoomDevices } from "./smartRoom";

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
}

export interface DemoState {
  active: boolean;
  beatIndex: number;
  roomBreakout: boolean;
  frontDoor: boolean | null; // null = hidden, false = visible+closed, true = visible+open
  fade: boolean;
  storyChat: StoryChatState;
  storyWa: StoryChatState;
}

interface AppState {
  screen: ScreenId;
  tripId: string | null;
  chat: ChatContext | null;
  voiceOpen: boolean;
  bookingOpen: boolean;
  inStay: boolean;
  smartRoom: SmartRoomDevices;
  threads: PersistedThread[];
  wa: WaState;
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
  startStory: () => void;
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
  setStoryDraft: (text: string) => void;
  pushStoryUserMsg: (text: string) => void;
  setLumiTyping: (v: boolean) => void;
  pushStoryLumiMsg: (text?: string, widget?: import("./types").WidgetData) => void;
  clearStoryChat: () => void;

  // WA story chat — presentational (separate from live WaConversation)
  setStoryWaDraft: (text: string) => void;
  pushStoryWaUserMsg: (text: string) => void;
  setStoryWaLumiTyping: (v: boolean) => void;
  pushStoryWaLumiMsg: (text?: string, widget?: import("./types").WidgetData) => void;
  clearStoryWa: () => void;

  createThread: (firstUserText: string) => string;
  saveThreadMessages: (id: string, messages: UIMessage[]) => void;
  renameThread: (id: string, topic: string, emoji?: string) => void;
  markRead: (id: string) => void;
  resetSession: () => void;
  loadDemoData: () => void;
  clearThreads: () => void;
  loadThread: (id: string) => void;

  // WhatsApp demo channel
  setWaEnabled: (v: boolean) => void;
  saveWaMessages: (messages: UIMessage[]) => void;
  addWaMarker: (marker: Omit<WaTopicMarker, "id" | "createdAt">) => void;
  setWaActiveThread: (threadId: string | null) => void;
  setWaPendingText: (text: string | null) => void;
  beginWaThread: (firstUserText: string) => string;
  pushLumiOutbound: (p: {
    topic: string; emoji: string; filter: ThreadFilter;
    appMessages: UIMessage[]; waMessages: UIMessage[];
  }) => void;
  resolveWaThread: (p: {
    topicMatch: string; waText: string; appStatusMessage: UIMessage;
  }) => void;
  appendWaMessages: (messages: UIMessage[]) => void;
  resetWa: () => void;
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
      demo: {
        active: false,
        beatIndex: 0,
        roomBreakout: false,
        frontDoor: null,
        fade: false,
        storyChat: { messages: [], draft: "", lumiTyping: false },
        storyWa:   { messages: [], draft: "", lumiTyping: false },
      },
      wa: {
        enabled: false,
        messages: [],
        markers: [],
        activeThreadId: null,
        pendingGuestText: null,
        resetCount: 0,
        createdAt: 0,
        updatedAt: 0,
      },

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

      startStory: () => set((s) => ({
        demo: {
          ...s.demo,
          active: true,
          beatIndex: 0,
          roomBreakout: false,
          frontDoor: false,
          fade: false,
          storyChat: { messages: [], draft: "", lumiTyping: false },
          storyWa:   { messages: [], draft: "", lumiTyping: false },
        },
      })),
      exitStory: () => set((s) => ({
        demo: {
          ...s.demo,
          active: false,
          beatIndex: 0,
          roomBreakout: false,
          frontDoor: false,
          fade: false,
          storyChat: { messages: [], draft: "", lumiTyping: false },
          storyWa:   { messages: [], draft: "", lumiTyping: false },
        },
        chat: null,
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
          demo: { ...s.demo, storyChat: { messages: [], draft: "", lumiTyping: false } },
          chat: { kind: "stay", title: "Lumi" },
        }));
      },
      openStoryThread: (id) => {
        const thread = demoSeedThread(id);
        if (!thread) return;
        set((s) => ({
          demo: { ...s.demo, storyChat: { messages: thread.messages, draft: "", lumiTyping: false } },
          chat: { kind: "thread", title: thread.topic, threadId: id, hint: thread.hint },
        }));
      },
      setStoryDraft: (text) =>
        set((s) => ({ demo: { ...s.demo, storyChat: { ...s.demo.storyChat, draft: text } } })),
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
          demo: { ...s.demo, storyChat: { messages: [], draft: "", lumiTyping: false } },
          chat: null,
        })),

      setStoryWaDraft: (text) =>
        set((s) => ({ demo: { ...s.demo, storyWa: { ...s.demo.storyWa, draft: text } } })),
      pushStoryWaUserMsg: (text) => {
        const msg: UIMessage = {
          id: `storywa_u_${nanoid(6)}`,
          role: "user",
          parts: [{ type: "text", text }],
        };
        set((s) => ({
          demo: {
            ...s.demo,
            storyWa: { ...s.demo.storyWa, draft: "", messages: [...s.demo.storyWa.messages, msg] },
          },
        }));
      },
      setStoryWaLumiTyping: (v) =>
        set((s) => ({ demo: { ...s.demo, storyWa: { ...s.demo.storyWa, lumiTyping: v } } })),
      pushStoryWaLumiMsg: (text, widget) => {
        const parts: UIMessage["parts"] = [];
        if (text) parts.push({ type: "text", text });
        if (widget) {
          parts.push({
            type: `tool-${widget.type}`,
            toolCallId: `storywa_w_${nanoid(6)}`,
            state: "output-available",
            input: {},
            output: widget.data,
          } as unknown as UIMessage["parts"][number]);
        }
        const msg: UIMessage = { id: `storywa_l_${nanoid(6)}`, role: "assistant", parts };
        set((s) => ({
          demo: {
            ...s.demo,
            storyWa: { ...s.demo.storyWa, lumiTyping: false, messages: [...s.demo.storyWa.messages, msg] },
          },
        }));
      },
      clearStoryWa: () =>
        set((s) => ({
          demo: { ...s.demo, storyWa: { messages: [], draft: "", lumiTyping: false } },
        })),

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
        set((s) => ({
          screen: "explore",
          tripId: null,
          chat: null,
          voiceOpen: false,
          bookingOpen: false,
          smartRoom: INITIAL_SMART_ROOM,
          threads: [],
          wa: {
            ...s.wa,
            messages: [],
            markers: [],
            activeThreadId: null,
            pendingGuestText: null,
            resetCount: s.wa.resetCount + 1,
            updatedAt: Date.now(),
          },
        }));
      },

      setWaEnabled: (v) => set((s) => ({ wa: { ...s.wa, enabled: v } })),
      saveWaMessages: (messages) =>
        set((s) => ({ wa: { ...s.wa, messages, updatedAt: Date.now() } })),
      addWaMarker: (marker) =>
        set((s) => ({
          wa: {
            ...s.wa,
            markers: [...s.wa.markers, { ...marker, id: `wamarker_${nanoid(6)}`, createdAt: Date.now() }],
          },
        })),
      setWaActiveThread: (threadId) =>
        set((s) => ({ wa: { ...s.wa, activeThreadId: threadId } })),
      setWaPendingText: (text) =>
        set((s) => ({ wa: { ...s.wa, pendingGuestText: text } })),

      beginWaThread: (firstUserText) => {
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
          unread: true,
        };
        set((s) => ({
          threads: [next, ...s.threads],
          wa: { ...s.wa, activeThreadId: id, updatedAt: now },
        }));
        return id;
      },

      pushLumiOutbound: ({ topic, emoji, filter, appMessages, waMessages }) => {
        const id = `th_${nanoid(8)}`;
        const now = Date.now();
        const thread: PersistedThread = {
          id, topic, emoji, filter, state: "open",
          messages: appMessages,
          createdAt: now, updatedAt: now,
          source: "live", unread: true,
        };
        const lastMsgId =
          get().wa.messages[get().wa.messages.length - 1]?.id ?? "__start__";
        const marker: WaTopicMarker = {
          id: `wamarker_${nanoid(6)}`,
          threadId: id, topic, emoji,
          afterMessageId: lastMsgId,
          createdAt: now,
        };
        set((s) => ({
          threads: [thread, ...s.threads],
          wa: {
            ...s.wa,
            messages: [...s.wa.messages, ...waMessages],
            markers: [...s.wa.markers, marker],
            activeThreadId: id,
            updatedAt: now,
          },
        }));
      },

      resolveWaThread: ({ topicMatch, waText, appStatusMessage }) => {
        const thread = get().threads.find(
          (t) => t.topic.toLowerCase().includes(topicMatch.toLowerCase()) && t.source === "live",
        );
        const now = Date.now();
        const waMsg: UIMessage = {
          id: `wa_${nanoid(8)}`,
          role: "assistant",
          parts: [{ type: "text", text: waText }],
        };
        set((s) => ({
          threads: thread
            ? s.threads.map((t) =>
                t.id === thread.id
                  ? { ...t, state: "resolved", messages: [...t.messages, appStatusMessage], updatedAt: now, preview: undefined, time: undefined }
                  : t,
              )
            : s.threads,
          wa: {
            ...s.wa,
            messages: [...s.wa.messages, waMsg],
            updatedAt: now,
          },
        }));
      },

      appendWaMessages: (messages) =>
        set((s) => ({
          wa: { ...s.wa, messages: [...s.wa.messages, ...messages], updatedAt: Date.now() },
        })),

      resetWa: () =>
        set((s) => ({
          wa: {
            ...s.wa,
            messages: [],
            markers: [],
            activeThreadId: null,
            pendingGuestText: null,
            resetCount: s.wa.resetCount + 1,
            updatedAt: Date.now(),
          },
        })),

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
      partialize: (s) => ({ threads: s.threads, wa: s.wa, inStay: s.inStay, tvShader: s.tvShader }),
    },
  ),
);

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
