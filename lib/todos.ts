export type TodoStatus = "backlog" | "in-progress" | "done";
export type TodoTag = "UX" | "Cross-channel" | "Prototype" | "Stakeholder";
export type TodoPriority = "high" | "medium" | "low" | null;

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  tag: TodoTag;
  priority: TodoPriority;
}

export const INITIAL_TODOS: Todo[] = [
  // UX / Product — from Oliver meeting Jun 4
  {
    id: "fab-label",
    title: 'Reconsider FAB label "Ask AI"',
    description:
      'Guests won\'t know what AI means. Oliver: a "virtual receptionist" fits the hotel context. Explore "Ask Lumi", "Reception", or a more branded CTA. Needs light user testing.',
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  {
    id: "proactive-nudges",
    title: "Design proactive nudge UX",
    description:
      "Surface next-best questions without push notifications — a pull model. Show contextual suggestions on app open, especially at key journey moments (day of arrival, OCI incomplete).",
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  {
    id: "thread-splitting",
    title: "Thread splitting logic",
    description:
      "Define when a conversation branches into sub-threads. E.g. towels request mid-ramen Q&A — auto-split or ask the guest? How does it look in the Messages inbox?",
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  {
    id: "chat-widgets",
    title: "In-chat widget types",
    description:
      "Enumerate the widget set: quick-reply chips, reservation card, ops status / live activity, map, push notification display. Define which are in-thread vs. pinned at top.",
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  {
    id: "voice-thread",
    title: "Voice conversation in Messages",
    description:
      "How do voice sessions appear in the inbox? Options: action summary, full transcript, hybrid. Requires a thread model decision and a distinct thread type.",
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  {
    id: "booking-ai",
    title: "AI companion for shopping mode",
    description:
      "Design Lumi's role when a guest is browsing/booking. Contextual starters per property, comparison help, \"what's included\" Q&A. Oliver excited about this as a differentiator.",
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  {
    id: "maintenance-display",
    title: "Maintenance & announcement display",
    description:
      "How do fire alarms, maintenance notices, and property-wide announcements appear in-app? In-thread message, banner, or a dedicated section?",
    status: "backlog",
    tag: "UX",
    priority: null,
  },
  // Cross-channel
  {
    id: "whatsapp-channel-design",
    title: "WhatsApp ↔ App channel design + demo",
    description:
      "One-way read model: WhatsApp messages appear in-app, no write-back (Meta charges 15¢/msg). Define the UX for when guests switch channels mid-conversation — Lumi retains full context, avoid double-starting threads. Build a side-by-side WhatsApp vs app comparison for the next Oliver session to show the delta clearly.",
    status: "in-progress",
    tag: "Cross-channel",
    priority: "high",
  },
  // Prototype / Demo
  {
    id: "messages-inbox",
    title: "MessagesScreen Figma-faithful",
    description:
      "Implement the Messages inbox per Figma spec — thread grouping by trip/general, property photo vs Lumi avatar, unread states, tag chips.",
    status: "in-progress",
    tag: "Prototype",
    priority: null,
  },
  // Stakeholder
  {
    id: "session-thomas-matthew",
    title: "Session: Thomas & Matthew",
    description:
      "Get early engineering reaction to the direction. Oliver: \"I don't want 'this is too hard' — that blocks innovation.\" Frame as vision alignment, not scope-setting.",
    status: "backlog",
    tag: "Stakeholder",
    priority: null,
  },
  {
    id: "session-geha",
    title: "Session: Geha (CEO)",
    description:
      "Present prototype to CEO once the UX logic (channel flow, thread model) is clearer. Oliver to arrange. Use the WhatsApp side-by-side demo as the anchor.",
    status: "backlog",
    tag: "Stakeholder",
    priority: null,
  },
];

export const STORAGE_KEY = "lumi-todos-v5";

export const TAG_COLORS: Record<TodoTag, string> = {
  UX: "bg-purple-900/40 text-purple-300",
  "Cross-channel": "bg-blue-900/40 text-blue-300",
  Prototype: "bg-amber-900/40 text-amber-300",
  Stakeholder: "bg-green-900/40 text-green-300",
};

export const STATUS_LABELS: Record<TodoStatus, string> = {
  backlog: "Backlog",
  "in-progress": "In Progress",
  done: "Done",
};

export const NEXT_STATUS: Record<TodoStatus, TodoStatus> = {
  backlog: "in-progress",
  "in-progress": "done",
  done: "backlog",
};

export const PREV_STATUS: Record<TodoStatus, TodoStatus | null> = {
  backlog: null,
  "in-progress": "backlog",
  done: "in-progress",
};

export const PRIORITY_ORDER: Record<NonNullable<TodoPriority> | "none", number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export const PRIORITY_LABELS: Record<NonNullable<TodoPriority>, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PRIORITY_BADGE: Record<NonNullable<TodoPriority>, string> = {
  high: "bg-red-900/40 text-red-400",
  medium: "bg-amber-900/40 text-amber-400",
  low: "bg-[#2a2a2a] text-[#888]",
};

export const PRIORITY_DOT: Record<NonNullable<TodoPriority>, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-[#555]",
};
