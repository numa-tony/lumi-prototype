"use client";

// Whether the world scenes behind the phone (the room, the front door) should
// render right now. Lives apart from the story registry so `lib/demo/stories.ts`
// stays free of store imports and the store can depend on it.

import { useApp } from "@/lib/store";
import { getStory } from "./stories";

export function useStoryScenes(): boolean {
  const active = useApp((s) => s.demo.active);
  const storyId = useApp((s) => s.demo.storyId);
  return !active || getStory(storyId).scenes;
}
