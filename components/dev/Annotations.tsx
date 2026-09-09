"use client";

// Agentation — click anything in the running app, leave a note, and it syncs to
// the coding agent with the element's selector and position attached. Beats
// describing "the thing in the bottom-left corner" in prose.
//
// Development only. The toolbar never loads in a production build, so it can't
// appear over the demo on Vercel.
//
// Needs the local sync server: `npx agentation-mcp server` (HTTP on :4747 for
// the browser, MCP on stdio for the agent). `npx agentation-mcp doctor` checks
// both ends.

import dynamic from "next/dynamic";

const SYNC_ENDPOINT = "http://localhost:4747";

// Loaded lazily and client-side only: the toolbar measures real DOM nodes, so
// it has nothing to do during SSR, and prod never fetches the chunk.
const Agentation = dynamic(
  () => import("agentation").then((m) => m.Agentation),
  { ssr: false },
);

export function Annotations() {
  if (process.env.NODE_ENV === "production") return null;
  return <Agentation endpoint={SYNC_ENDPOINT} />;
}
