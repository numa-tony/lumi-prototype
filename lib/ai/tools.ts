import { tool } from "ai";
import { z } from "zod";
import { CURRENT_RESERVATION } from "../mock/guest";
import {
  BERLIN_POIS,
  PROPERTIES,
  IMG,
  type MockProperty,
} from "../mock/properties";

// ---------------------------------------------------------------------------
// Widget tools. Each tool's `execute` returns the data the matching React
// component renders (via the `tool-<name>` message part). Image URLs and other
// "real-looking" data are injected here from the mock world so the model never
// has to invent them — it just decides *what* to show.
// ---------------------------------------------------------------------------

function imageForPoi(type: string): string {
  if (/ramen|noodle|food|restaurant/i.test(type)) return IMG.ramen;
  if (/coffee|café|cafe/i.test(type)) return IMG.coffee;
  return IMG.coffee;
}

function resolveProperties(names?: string[], city?: string): MockProperty[] {
  let list = PROPERTIES;
  if (city) list = list.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  if (names && names.length) {
    const lowered = names.map((n) => n.toLowerCase());
    const matched = PROPERTIES.filter((p) =>
      lowered.some((n) => p.name.toLowerCase().includes(n) || n.includes(p.city.toLowerCase())),
    );
    if (matched.length) list = matched;
  }
  return list.length ? list : PROPERTIES;
}

export const tools = {
  reservationCard: tool({
    description:
      "Show the guest's current reservation: property, dates, room, door code, status.",
    inputSchema: z.object({}),
    execute: async () => CURRENT_RESERVATION,
  }),

  statusWidget: tool({
    description:
      "Show the live state of a service request (maintenance, housekeeping, tech, access). Use for any logged issue.",
    inputSchema: z.object({
      title: z.string().describe("Short title, e.g. 'Technician on the way'"),
      state: z.enum(["open", "in_progress", "awaiting_guest", "resolved", "closed"]),
      detail: z.string().optional().describe("e.g. 'Maintenance · Room 204'"),
      eta: z.string().optional().describe("Only if known, e.g. 'Arriving in ~7 min'"),
      stages: z
        .array(z.object({ label: z.string(), done: z.boolean() }))
        .optional()
        .describe("Progress checklist. Typical: Submitted, Acknowledged, Assigned, In progress, Resolved"),
    }),
    execute: async (input) => input,
  }),

  listWidget: tool({
    description:
      "A vertical scannable list — orderable extras, FAQs, or simple recommendations.",
    inputSchema: z.object({
      title: z.string().optional(),
      items: z
        .array(
          z.object({
            title: z.string(),
            subtitle: z.string().optional(),
            meta: z.string().optional().describe("e.g. a price like '€12 per person'"),
            emoji: z.string().optional(),
            action: z.string().optional().describe("Inline button label, e.g. 'Add'"),
          }),
        )
        .min(1),
    }),
    execute: async (input) => input,
  }),

  quickReply: tool({
    description:
      "2–5 tap-to-respond choices or a yes/no confirmation. Do NOT include 'Something else' — it is added automatically.",
    inputSchema: z.object({
      prompt: z.string().optional(),
      options: z.array(z.string()).min(2).max(5),
    }),
    execute: async (input) => input,
  }),

  mapWidget: tool({
    description:
      "Nearby points of interest (restaurants, cafés, things to do) around the property.",
    inputSchema: z.object({
      title: z.string().optional(),
      query: z.string().optional().describe("What the guest is looking for, e.g. 'ramen'"),
      pois: z
        .array(
          z.object({
            name: z.string(),
            type: z.string(),
            rating: z.number().optional(),
            walk: z.string().optional().describe("e.g. '8 min walk'"),
          }),
        )
        .optional(),
    }),
    execute: async (input) => {
      let pois = input.pois;
      if (!pois || pois.length === 0) {
        const q = input.query?.toLowerCase() ?? "";
        pois = BERLIN_POIS.filter((p) =>
          q ? p.type.toLowerCase().includes(q) || q.includes(p.type.toLowerCase()) : true,
        );
        if (!pois.length) pois = BERLIN_POIS;
      }
      return {
        title: input.title,
        pois: pois.map((p) => ({ ...p, image: imageForPoi(p.type) })),
      };
    },
  }),

  locationPin: tool({
    description: "A single place with one-tap directions.",
    inputSchema: z.object({
      name: z.string(),
      address: z.string(),
    }),
    execute: async (input) => ({ ...input, image: IMG.coffee }),
  }),

  propertyCarousel: tool({
    description: "Browse Numa properties (for prospective bookings or comparisons).",
    inputSchema: z.object({
      title: z.string().optional(),
      names: z.string().array().optional().describe("Property or city names to feature"),
      city: z.string().optional(),
    }),
    execute: async (input) => ({
      title: input.title,
      items: resolveProperties(input.names, input.city),
    }),
  }),

  roomCard: tool({
    description: "A specific room option with bed config, size, and nightly rate.",
    inputSchema: z.object({
      name: z.string(),
      bed: z.string().describe("e.g. 'Queen bed'"),
      size: z.string().optional().describe("e.g. '18 m²'"),
      priceFrom: z.string().optional().describe("e.g. 'From €164 / night'"),
      amenities: z.string().array().optional(),
    }),
    execute: async (input) => ({ ...input, image: IMG.roomPink }),
  }),

  videoCard: tool({
    description: "A short how-to video card (e.g. operating the AC, finding breakfast).",
    inputSchema: z.object({
      title: z.string(),
      body: z.string().optional().describe("A few lines of instructions under the video"),
    }),
    execute: async (input) => ({ ...input, poster: IMG.acVideo }),
  }),

  setThreadTopic: tool({
    description:
      "Set a short topic and emoji for the current Lumi thread so it shows up nicely in the Messages inbox. Call this once, early in any brand-new conversation.",
    inputSchema: z.object({
      topic: z
        .string()
        .max(40)
        .describe("Short label, ideally 1–3 words. No punctuation, no quotes."),
      emoji: z
        .string()
        .max(4)
        .describe("A single emoji that represents the topic, e.g. '🧊' or '🍜'."),
    }),
    execute: async ({ topic, emoji }) => ({ topic, emoji }),
  }),

  imageCard: tool({
    description: "Property, room, or food photos.",
    inputSchema: z.object({
      title: z.string().optional(),
      caption: z.string().optional(),
      subject: z
        .enum(["room", "property", "food"])
        .optional()
        .describe("What to show photos of"),
    }),
    execute: async (input) => {
      const pool =
        input.subject === "food"
          ? [IMG.breakfast, IMG.ramen, IMG.coffee]
          : input.subject === "property"
            ? [IMG.propBerlin, IMG.propBarcelona, IMG.propLondon]
            : [IMG.roomBerlin, IMG.roomPink, IMG.roomBarcelona];
      return { title: input.title, caption: input.caption, images: pool };
    },
  }),

  controlDevice: tool({
    description:
      "Control a smart device in the guest's Numa room (door, lights, TV, blinds, AC). " +
      "Call whenever the guest asks to change something physical in the room — e.g. " +
      "'turn on the lights', 'dim to 30%', 'open the blinds', 'put on Netflix', " +
      "'set 22 degrees', 'unlock the door'. Only set the fields you intend to change. " +
      "After calling it, confirm in one short warm sentence. Do NOT render any widget.",
    inputSchema: z.object({
      device:   z.enum(["door", "lights", "tv", "blinds", "ac"]),
      power:    z.enum(["on", "off"]).optional()
                  .describe("Turn the device on or off (lights, tv)."),
      door:     z.enum(["locked", "unlocked", "open"]).optional()
                  .describe("Door state. 'open' for open door, 'unlocked' to just unlock."),
      level:    z.number().min(0).max(100).optional()
                  .describe("0–100. lights=brightness, tv=volume, blinds=position (0 closed, 100 open)."),
      warmth:   z.enum(["warm", "neutral", "cool"]).optional()
                  .describe("Light color temperature."),
      muted:    z.boolean().optional(),
      channel:  z.string().optional().describe("TV channel name, e.g. 'ARTE'."),
      app:      z.string().optional().describe("Streaming app, e.g. 'Netflix', 'Spotify'."),
      mode:     z.enum(["cool", "heat", "off"]).optional().describe("AC mode."),
      setpoint: z.number().min(15).max(30).optional().describe("Target temperature in °C."),
    }),
    execute: async (input) => {
      const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
      const patch: Record<string, unknown> = {};

      switch (input.device) {
        case "door":
          patch.door = { state: input.door ?? "unlocked" };
          break;
        case "lights":
          patch.lights = {
            ...(input.power  ? { on: input.power === "on" } : {}),
            ...(input.level != null ? { brightness: clamp(input.level), on: true } : {}),
            ...(input.warmth ? { warmth: input.warmth, on: true } : {}),
          };
          break;
        case "tv":
          patch.tv = {
            ...(input.power   ? { on: input.power === "on" } : {}),
            ...(input.level  != null ? { volume: clamp(input.level) } : {}),
            ...(input.muted  != null ? { muted: input.muted } : {}),
            ...(input.channel ? { channel: input.channel, on: true, app: null } : {}),
            ...(input.app     ? { app: input.app, on: true, channel: null } : {}),
          };
          break;
        case "blinds":
          patch.blinds = { position: clamp(input.level ?? 100) };
          break;
        case "ac":
          patch.ac = {
            ...(input.mode ? { mode: input.mode } : {}),
            ...(input.setpoint != null
                ? { setpoint: Math.max(15, Math.min(30, Math.round(input.setpoint))),
                    ...(input.mode ? {} : { mode: "cool" }) }
                : {}),
          };
          break;
      }

      return { device: input.device, patch };
    },
  }),
};

export type LumiTools = typeof tools;
