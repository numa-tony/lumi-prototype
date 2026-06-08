import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import type { SeedMessage, ThreadFilter } from "../types";
import { seedMessageToUIMessage } from "./threads";

export type WaScenarioKind = "guest-wa" | "app-only" | "ops-update" | "lumi-outbound";

export interface WaScenario {
  id: string;
  label: string;
  description: string;
  kind: WaScenarioKind;
  // guest-wa
  guestText?: string;
  // app-only
  appThread?: {
    topic: string;
    emoji: string;
    filter: ThreadFilter;
    hint: string;
    messages: SeedMessage[];
  };
  // ops-update
  topicMatch?: string;
  waText?: string;
  appStatusSeed?: SeedMessage;
  // lumi-outbound
  outbound?: {
    topic: string;
    emoji: string;
    filter: ThreadFilter;
    appSeeds: SeedMessage[];
    waSeeds: SeedMessage[];
  };
}

export const SARAH_DAY: WaScenario[] = [
  {
    id: "s1",
    label: "09:14 · Towels",
    description: "Sarah asks for extra towels via WhatsApp",
    kind: "guest-wa",
    guestText:
      "hey can i get extra towels in my room? we're 2 people but only got towels for 1",
  },
  {
    id: "s2",
    label: "10:42 · AC broken",
    description: "Sarah reports the AC is blowing warm air",
    kind: "guest-wa",
    guestText:
      "also the ac in my room isn't cooling at all, it's just blowing warm air",
  },
  {
    id: "s3",
    label: "10:55 · Towels resolved",
    description: "Housekeeping marks towels delivered — both surfaces update",
    kind: "ops-update",
    topicMatch: "Towels",
    waText: "Delivered to room 204. Anything else for the towels, or all set?",
    appStatusSeed: {
      role: "assistant",
      text: "Delivered to room 204. All set?",
      widget: {
        type: "statusWidget",
        data: {
          title: "Towels delivered",
          state: "resolved",
          detail: "Housekeeping · Room 204",
        },
      },
    },
  },
  {
    id: "s4",
    label: "11:45 · Ramen (app only)",
    description: "Sarah asks about ramen in the Lumi app — WhatsApp stays silent",
    kind: "app-only",
    appThread: {
      topic: "Ramen",
      emoji: "🍜",
      filter: "support",
      hint:
        "The guest asked for ramen recommendations near Numa Berlin Novela. Cocolo Ramen (8 min walk) and Takumi Nine (12 min walk) were suggested.",
      messages: [
        { role: "user", text: "any good ramen near here?", time: "11:45" },
        {
          role: "assistant",
          text: "Two great options nearby:",
          time: "11:45",
          widget: {
            type: "mapWidget",
            data: {
              title: "Ramen near Berlin Novela",
              pois: [
                {
                  name: "Cocolo Ramen",
                  type: "Ramen",
                  rating: 4.7,
                  walk: "8 min",
                  image:
                    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80&auto=format&fit=crop",
                },
                {
                  name: "Takumi Nine",
                  type: "Ramen",
                  rating: 4.5,
                  walk: "12 min",
                  image:
                    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80&auto=format&fit=crop",
                },
              ],
            },
          },
        },
      ],
    },
  },
  {
    id: "s5",
    label: "12:30 · AC fixed",
    description: "Technician marks AC repair complete — both surfaces update",
    kind: "ops-update",
    topicMatch: "AC",
    waText:
      "AC is fixed. The technician topped up coolant and tested it. Let me know if anything else feels off.",
    appStatusSeed: {
      role: "assistant",
      text: "AC is fixed. Technician completed the repair.",
      widget: {
        type: "statusWidget",
        data: {
          title: "AC repair complete",
          state: "resolved",
          detail: "Maintenance · Room 204",
        },
      },
    },
  },
  {
    id: "s6",
    label: "14:20 · Late checkout",
    description:
      "Lumi initiates a late checkout offer — fires to WhatsApp AND creates an app thread",
    kind: "lumi-outbound",
    outbound: {
      topic: "Late checkout",
      emoji: "🕒",
      filter: "updates",
      waSeeds: [
        {
          role: "assistant",
          text: "Want 2 extra hours on Sunday? Checkout can be extended to 2:00 PM for €25.",
        },
      ],
      appSeeds: [
        {
          role: "assistant",
          text: "Want 2 extra hours on Sunday? I can extend your checkout to 2:00 PM for €25.",
          widget: {
            type: "quickReply",
            data: { options: ["Add for €25", "No thanks", "Tell me more"] },
          },
        },
      ],
    },
  },
];

// Convert a SeedMessage to UIMessage for use in store actions.
// Uses a unique threadId prefix to avoid ID collisions across scenario runs.
export function scenarioSeedToUIMessage(seed: SeedMessage, prefix: string): UIMessage {
  return seedMessageToUIMessage(`wa-scenario-${prefix}`, seed);
}

export function buildOutboundMessages(
  seeds: SeedMessage[],
  prefix: string,
  isOutbound = false,
): UIMessage[] {
  return seeds.map((s) => {
    const msg = scenarioSeedToUIMessage(s, `${prefix}-${nanoid(4)}`);
    if (isOutbound && msg.role === "assistant") {
      return { ...msg, metadata: { origin: "outbound" } };
    }
    return msg;
  });
}
