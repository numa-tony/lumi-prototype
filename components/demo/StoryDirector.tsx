"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { STORY } from "@/lib/demo/story";
import { snapToBeat, playBeat, fastForwardCurrent } from "@/lib/demo/storyRunner";
import { StoryStage } from "./StoryStage";

export function StoryDirector() {
  const demoActive = useApp((s) => s.demo.active);
  const beatIndex = useApp((s) => s.demo.beatIndex);
  const exitStory = useApp((s) => s.exitStory);
  const nextBeat = useApp((s) => s.nextBeat);
  const prevBeat = useApp((s) => s.prevBeat);

  // Track whether last move was forward (play animated) or backward (snap instant)
  const lastDirection = useRef<"forward" | "backward">("forward");
  // Track the previous beat so we can detect the direction
  const prevBeatIndex = useRef(beatIndex);
  // Whether a playBeat is currently running for this beatIndex
  const playingRef = useRef(false);

  // When beatIndex changes, run the appropriate playback
  useEffect(() => {
    if (!demoActive) return;

    const dir = beatIndex >= prevBeatIndex.current ? "forward" : "backward";
    prevBeatIndex.current = beatIndex;
    lastDirection.current = dir;

    if (dir === "backward") {
      // Snap instantly to full state at this beat (no animation)
      snapToBeat(beatIndex);
      return;
    }

    // Forward: play animated steps for this beat
    playingRef.current = true;
    playBeat(beatIndex).then(() => { playingRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoActive, beatIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!demoActive) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (beatIndex < STORY.length - 1) {
          if (playingRef.current) {
            // Already playing — fast-forward the current beat, then advance
            fastForwardCurrent(beatIndex);
            playingRef.current = false;
          }
          nextBeat();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevBeat();
      } else if (e.key === "Escape") {
        exitStory();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demoActive, beatIndex, nextBeat, prevBeat, exitStory]);

  // Kick off beat 0 when story starts
  useEffect(() => {
    if (demoActive) {
      prevBeatIndex.current = 0;
      playBeat(0);
    }
  }, [demoActive]);

  if (!demoActive) return null;
  return <StoryStage beatIndex={beatIndex} />;
}
