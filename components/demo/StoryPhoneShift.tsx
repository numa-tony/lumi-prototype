"use client";

import { useApp } from "@/lib/store";
import { getStory } from "@/lib/demo/stories";

export function StoryPhoneShift({ children }: { children: React.ReactNode }) {
  const active = useApp((s) => s.demo.active);
  const storyId = useApp((s) => s.demo.storyId);
  const beatIndex = useApp((s) => s.demo.beatIndex);
  // On the title card the phone shifts left so the big title text (rendered at
  // ~58% from the left) has room. Every other beat keeps the phone centered.
  // Only the full-chrome story shifts the phone aside for its title text;
  // a bare story has no title, so the phone stays centred throughout.
  const story = getStory(storyId);
  const shifted = active && story.chrome === "full" && story.beats[beatIndex]?.titleCard;

  return (
    <div
      className="flex shrink-0 flex-col items-center"
      style={{
        transform: shifted ? "translateX(-22vw)" : "translateX(0)",
        transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
