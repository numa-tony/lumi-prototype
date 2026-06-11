"use client";

import { useApp } from "@/lib/store";
import { STORY } from "@/lib/demo/story";

export function StoryPhoneShift({ children }: { children: React.ReactNode }) {
  const active = useApp((s) => s.demo.active);
  const beatIndex = useApp((s) => s.demo.beatIndex);
  const shifted = active && STORY[beatIndex]?.titleCard;

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
