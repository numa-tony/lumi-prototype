// The story registry. Everything that runs on the Story Mode engine is
// registered here; the store holds only the id (demo.storyId).

import type { PressBeat, Story } from "./types";
import { STORY, SEGMENTS } from "./story";
import { ALLHANDS, ALLHANDS_SEGMENTS } from "./allHands";

export const DEFAULT_STORY_ID = "sarah";

export const STORIES: Record<string, Story> = {
  sarah: {
    id: "sarah",
    label: "Sarah's Day",
    title: "Sarah’s epic stay with Lumi",
    endTitle: "The End",
    duration: "4 minutes",
    chrome: "full",
    initialSurface: "app",
    scenes: true,
    segments: SEGMENTS,
    beats: STORY,
  },
  allhands: {
    id: "allhands",
    label: "All-Hands",
    title: "It started with an air conditioner.",
    endTitle: "It started with an air conditioner.",
    endSubtitle: "It ended with her booking her next trip.",
    chrome: "bare",
    initialSurface: "whatsapp",
    scenes: false,
    segments: ALLHANDS_SEGMENTS,
    beats: ALLHANDS,
  },
};

export function getStory(id: string): Story {
  return STORIES[id] ?? STORIES[DEFAULT_STORY_ID];
}

export function beatsForStory(id: string): PressBeat[] {
  return getStory(id).beats;
}
