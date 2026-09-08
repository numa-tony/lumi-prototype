"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

// Deep-link into Story Mode: visiting the app with `?story` (or `#story`) in the
// URL auto-starts a story — bare `?story` keeps opening "Sarah's Day", and
// `?story=allhands` opens the All-Hands walkthrough — so a shared link opens on the title
// card instead of the main app. Reads window.location directly in an effect
// (client-only) so no Suspense boundary is needed. The param is then stripped
// from the address bar so exiting the story and refreshing lands on the clean
// main app — the shared link still auto-starts on every fresh visit.
export function StoryDeepLink() {
  useEffect(() => {
    const { search, hash, pathname } = window.location;
    const params = new URLSearchParams(search);
    const wantsStory = params.has("story") || hash.startsWith("#story");
    if (!wantsStory) return;

    // ?story → Sarah's Day (unchanged); ?story=allhands → the All-Hands script.
    const id = params.get("story") || hash.replace("#story", "").replace("=", "") || "sarah";
    useApp.getState().startStory(id);
    window.history.replaceState(null, "", pathname);
  }, []);

  return null;
}
