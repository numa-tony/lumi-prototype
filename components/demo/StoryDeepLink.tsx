"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

// Deep-link into Story Mode: visiting the app with `?story` (or `#story`) in the
// URL auto-starts "Sarah's Day", so a shared link opens straight on the title
// card instead of the main app. Reads window.location directly in an effect
// (client-only) so no Suspense boundary is needed. The param is then stripped
// from the address bar so exiting the story and refreshing lands on the clean
// main app — the shared link still auto-starts on every fresh visit.
export function StoryDeepLink() {
  useEffect(() => {
    const { search, hash, pathname } = window.location;
    const wantsStory =
      new URLSearchParams(search).has("story") || hash === "#story";
    if (!wantsStory) return;

    useApp.getState().startStory();
    window.history.replaceState(null, "", pathname);
  }, []);

  return null;
}
