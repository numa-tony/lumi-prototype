// Shared types for the Numa / Lumi prototype.

import type { UIMessage } from "ai";

// ---------------------------------------------------------------------------
// WhatsApp demo channel
// ---------------------------------------------------------------------------

// Synthetic section header injected into the WA linear stream when a new Lumi
// thread is born. Lives separately so it never pollutes the UIMessage[] fed to
// useChat / convertToModelMessages.
export interface WaTopicMarker {
  id: string;
  threadId: string;
  topic: string;
  emoji: string;
  afterMessageId: string; // insert AFTER this UIMessage.id
  createdAt: number;
}

export interface WaState {
  enabled: boolean;
  messages: UIMessage[];      // full WA transcript — AI turns + injected ops/outbound
  markers: WaTopicMarker[];   // topic section headers (keyed to message ids)
  activeThreadId: string | null; // Lumi thread the current WA topic feeds
  pendingGuestText: string | null; // queue for scenario-button injections
  resetCount: number;         // incremented on resetWa() to key-remount the component
  createdAt: number;
  updatedAt: number;
}

export type ScreenId =
  | "explore"
  | "trips"
  | "tripDetail"
  | "messages"
  | "profile";

// Where the user opened Lumi from — drives the contextual starter prompts and
// the system-prompt context hint.
export type ChatContextKind = "explore" | "stay" | "property" | "thread";

export interface ChatContext {
  kind: ChatContextKind;
  title: string; // sheet header label, e.g. "Lumi"
  // Free-text hint appended to the system prompt so Lumi answers in-context.
  hint?: string;
  // Pre-filled conversation starters shown on an empty thread.
  starters?: string[];
  // If opened from an inbox thread, the thread it is bound to.
  threadId?: string;
}

// ---------------------------------------------------------------------------
// Widgets — one shape per widget kind. These are shared by:
//   - the AI tools (lib/ai/tools.ts) as the tool output
//   - the seeded threads (lib/mock/threads.ts) as static content
//   - the renderer (components/chat/widgets/WidgetRenderer.tsx)
// ---------------------------------------------------------------------------

export type WidgetType =
  | "reservationCard"
  | "listWidget"
  | "quickReply"
  | "statusWidget"
  | "propertyCarousel"
  | "roomCard"
  | "mapWidget"
  | "locationPin"
  | "videoCard"
  | "imageCard";

export interface ReservationCardData {
  property: string;
  location: string;
  image?: string;
  checkIn: string;
  checkOut: string;
  room?: string;
  doorCode?: string;
  status?: string;
  action?: string;
}

export interface ListItem {
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
  emoji?: string;
  action?: string;
}
export interface ListWidgetData {
  title?: string;
  items: ListItem[];
}

export interface QuickReplyData {
  prompt?: string;
  options: string[];
  // "Something else" is appended automatically by the component.
}

export type ServiceState =
  | "open"
  | "in_progress"
  | "awaiting_guest"
  | "resolved"
  | "closed";

export interface StatusStage {
  label: string;
  done: boolean;
}
export interface StatusWidgetData {
  title: string;
  state: ServiceState;
  detail?: string;
  eta?: string;
  stages?: StatusStage[];
}

export interface PropertyItem {
  name: string;
  location: string;
  image: string;
  priceFrom?: string;
  amenities?: string[];
}
export interface PropertyCarouselData {
  title?: string;
  items: PropertyItem[];
}

export interface RoomCardData {
  name: string;
  image: string;
  bed: string;
  size?: string;
  priceFrom?: string;
  amenities?: string[];
}

export interface Poi {
  name: string;
  type: string;
  rating?: number;
  image?: string;
  walk?: string;
}
export interface MapWidgetData {
  title?: string;
  pois: Poi[];
}

export interface LocationPinData {
  name: string;
  address: string;
  image?: string;
}

export interface VideoCardData {
  title: string;
  poster: string;
  body?: string;
}

export interface ImageCardData {
  title?: string;
  images: string[];
  caption?: string;
}

export type WidgetData =
  | { type: "reservationCard"; data: ReservationCardData }
  | { type: "listWidget"; data: ListWidgetData }
  | { type: "quickReply"; data: QuickReplyData }
  | { type: "statusWidget"; data: StatusWidgetData }
  | { type: "propertyCarousel"; data: PropertyCarouselData }
  | { type: "roomCard"; data: RoomCardData }
  | { type: "mapWidget"; data: MapWidgetData }
  | { type: "locationPin"; data: LocationPinData }
  | { type: "videoCard"; data: VideoCardData }
  | { type: "imageCard"; data: ImageCardData };

// ---------------------------------------------------------------------------
// Inbox threads
// ---------------------------------------------------------------------------

export type ThreadFilter = "priority" | "support" | "updates";

export interface SeedMessage {
  role: "user" | "assistant";
  text?: string;
  widget?: WidgetData;
  time?: string;
}

export interface Thread {
  id: string;
  topic: string; // "AC", "Towels"
  emoji: string; // 🧊
  state: ServiceState | "active";
  filter: ThreadFilter;
  preview: string; // last message preview in inbox
  time: string; // display time/date in inbox row
  active?: boolean; // pinned to top, shows ACTIVE
  unread?: boolean;
  live?: boolean; // the fully-live AI thread
  // The context Lumi should know when this thread is opened.
  hint?: string;
  seed: SeedMessage[];
}

// A user-or-demo thread persisted into localStorage via Zustand. The shape
// mirrors the AI SDK's UIMessage so re-opening a thread can hand `messages`
// straight back to `useChat` without conversion.
export interface PersistedThread {
  id: string;
  topic: string;
  emoji: string;
  filter: ThreadFilter;
  state: ServiceState | "active";
  hint?: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
  active?: boolean;
  unread?: boolean;
  source: "live" | "demo";
  // Optional display overrides — used by demo threads that ship with
  // hand-crafted inbox previews and times. Live threads leave these blank
  // and the inbox derives them from `messages` + `updatedAt`.
  preview?: string;
  time?: string;
}
