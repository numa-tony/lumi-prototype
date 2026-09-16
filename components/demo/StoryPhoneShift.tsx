"use client";

import { useApp } from "@/lib/store";
import { getStory } from "@/lib/demo/stories";
import { STAGE_PHOTOS } from "@/lib/demo/stagePhotos";

// Moves the phone as a whole.
//
// Sarah's Day (full chrome): on the title card the phone shifts left so the big
// title text (rendered at ~58% from the left) has room; every other beat keeps
// it centred.
//
// Photo-stage stories (All-Hands): the phone leaves the frame while a scene is
// being introduced and rises back on top when it's needed. The motion lives in
// app/globals.css (.stage-phone) as transitions rather than keyframes, so a
// press mid-rise retargets smoothly instead of jumping.
export function StoryPhoneShift({ children }: { children: React.ReactNode }) {
  const active = useApp((s) => s.demo.active);
  const storyId = useApp((s) => s.demo.storyId);
  const beatIndex = useApp((s) => s.demo.beatIndex);
  const focus = useApp((s) => s.demo.stage.focus);
  const instant = useApp((s) => s.demo.stage.instant);
  const photo = useApp((s) => s.demo.stage.photo);
  const story = getStory(storyId);

  if (active && story.stage === "photos") {
    // The phone picks up the room it's in: a faint rim light in the photo's
    // own hue, which follows the photo as the rooms change.
    const glow = (photo && STAGE_PHOTOS[photo]?.glow) || "transparent";
    return (
      <div
        className="stage-phone relative isolate flex shrink-0 flex-col items-center"
        data-offstage={focus === "scene"}
        data-instant={instant}
      >
        <div
          aria-hidden
          className="stage-rim pointer-events-none absolute -z-10"
          style={{ inset: "6% -22%", backgroundColor: glow }}
        />
        {children}
      </div>
    );
  }

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
