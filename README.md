# Numa — Lumi Prototype

A web prototype of the Numa mobile app, shown in a phone frame, built to demo **Lumi**, the
AI concierge. Screens (Explore, My Trips, Trip Detail, Messages, Profile) are visual
scaffolding; the live subsystem is **Lumi** — streaming chat that renders rich generative
widgets, grounded in a mock guest stay.

## Run it

```bash
npm install
# add a free Google Gemini key (no credit card): https://aistudio.google.com/apikey
cp .env.local.example .env.local   # then paste your key into GOOGLE_GENERATIVE_AI_API_KEY
npm run dev                        # http://localhost:3000
```

Open in a tall window so the whole phone fits.

## Try Lumi

- Tap **Ask AI** (the floating pill) on Explore or a trip → contextual starters.
- Open **Messages** → seeded threads already render widgets (status, map, carousel, decision).
- Ask things like: *"the AC in my room isn't cooling"*, *"any good ramen near here?"*,
  *"show me the Barcelona property"*, *"how do I use the AC?"* → Lumi replies with widgets.

## Swapping the model

The model is chosen in `lib/ai/model.ts` from `LUMI_MODEL` (`provider:model`, default
`google:gemini-2.5-flash`). To switch to Groq/Claude/etc.: `npm i @ai-sdk/<provider>`, add a
`case` in that file, set `LUMI_MODEL` + the provider's key. Nothing else changes.

## Where things live

- `components/device/` — phone frame, app shell.
- `components/screens/` — the five screens.
- `components/chat/` — chat sheet, thread view, composer, and `widgets/` (the generative UI).
- `lib/ai/` — model factory, Lumi's system prompt, widget tools.
- `lib/mock/` — guest persona, seeded inbox threads, properties/POIs. Edit these to restyle the
  demo's content. Design tokens live in `app/globals.css`.
