"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { STORY, SEGMENTS } from "@/lib/demo/story";
import type { SarahEmotion } from "@/lib/demo/story";
import { snapToBeat, playBeat } from "@/lib/demo/storyRunner";

const SARAH_EMOJI: Record<SarahEmotion, string> = {
  neutral:   "🙂",
  happy:     "😊",
  annoyed:   "😤",
  content:   "😌",
  surprised: "😲",
};

export function StoryStage({ beatIndex }: { beatIndex: number }) {
  const exitStory = useApp((s) => s.exitStory);
  const fade = useApp((s) => s.demo.fade);
  const beat = STORY[beatIndex];
  if (!beat) return null;

  const isFirst = beatIndex === 0;
  const isLast = beatIndex === STORY.length - 1;
  const emotion = beat.sarahEmotion ?? "neutral";
  const currentSegment = beat.segmentIndex;

  // Story beat number for counter (exclude title segment 0 and thesis segment 8)
  const storyBeatNum = Math.max(0, currentSegment - 0);
  const storyBeatTotal = SEGMENTS.length - 2; // segments 1–7

  return (
    <>
      {/* ── Background ────────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-[5] transition-all duration-700"
        style={{ background: beat.background }}
      />

      {/* ── Fade-to-black overlay ─────────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[8] bg-black"
        animate={{ opacity: fade ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      />

      {/* ── Chrome overlay ────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-30">

        {/* Progress rail — left edge, one dot per segment */}
        <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {SEGMENTS.filter((_, i) => i < SEGMENTS.length - 1).map((seg, i) => (
            <div
              key={seg.id}
              className="relative h-2 w-2 rounded-full transition-all duration-300"
              style={{
                background: i < currentSegment
                  ? "#ff671f"
                  : i === currentSegment
                    ? "#ff671f"
                    : "rgba(255,255,255,0.2)",
                transform: i === currentSegment ? "scale(1.4)" : "scale(1)",
                boxShadow: i === currentSegment ? "0 0 6px #ff671f" : "none",
              }}
            />
          ))}
        </div>

        {/* Title card — segment 0 */}
        {beat.titleCard && (
          <>
            <div
              className="absolute top-1/2 flex -translate-y-[55%] flex-col gap-6 text-left"
              style={{ left: "58%", maxWidth: "min(500px, 38vw)" }}
            >
              <h1
                className="font-bold leading-[1.08] text-white"
                style={{ fontSize: "clamp(36px, 4vw, 64px)" }}
              >
                Sarah&rsquo;s epic stay with Lumi
              </h1>
              <div className="flex items-center gap-2.5 text-white/50">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                  <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M9 5.5V9l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[clamp(14px,1.4vw,20px)] font-light">
                  Story duration:&nbsp; 4 minutes
                </span>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-10 right-10 flex flex-col items-end gap-4">
              <div className="relative flex flex-col items-center gap-1">
                <div className="flex gap-1">
                  <Keycap label="▲" />
                </div>
                <div className="relative flex gap-1">
                  <Keycap label="◀" />
                  <Keycap label="▼" />
                  <Keycap label="▶" green />
                  <div
                    className="pointer-events-none absolute -bottom-5 -right-4"
                    style={{ fontSize: "28px", transform: "scaleX(-1) rotate(-20deg)" }}
                  >
                    👆
                  </div>
                </div>
              </div>
              <div className="rounded-xl px-5 py-3.5" style={{ background: "#f5f0b8" }}>
                <p className="text-[15px] font-bold leading-snug text-[#1a1400]">
                  Use your keyboard arrows<br />to watch the story!
                </p>
              </div>
            </div>
          </>
        )}

        {/* The End card — final segment */}
        {beat.thesisCard && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-8 text-center"
            style={{ background: beat.background }}
          >
            <p
              className="font-bold leading-none tracking-tight text-white"
              style={{ fontSize: "clamp(56px, 7vw, 96px)" }}
            >
              The End
            </p>
            <div className="flex gap-4">
              <button
                className="rounded-full px-8 py-3 font-semibold text-white transition-opacity hover:opacity-80"
                style={{ background: "#ff671f", fontSize: "clamp(14px, 1.4vw, 18px)" }}
                onClick={async () => {
                  useApp.getState().setBeatIndex(0);
                  await snapToBeat(0);
                  playBeat(0);
                }}
              >
                Replay
              </button>
              <button
                className="rounded-full px-8 py-3 font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "clamp(14px, 1.4vw, 18px)",
                }}
                onClick={exitStory}
              >
                Back to main
              </button>
            </div>
          </div>
        )}

        {/* Narration caption */}
        {!beat.titleCard && !beat.thesisCard && beat.narration && (
          <div
            className="absolute left-[4%] top-[8%] max-w-[300px] rounded-2xl px-6 py-5"
            style={{ background: "rgba(255,243,180,0.95)" }}
          >
            <p className="text-[22px] font-semibold leading-snug text-[#1a1400]">
              {beat.narration}
            </p>
          </div>
        )}

        {/* Sarah's speech bubble */}
        {!beat.titleCard && !beat.thesisCard && beat.sarah && (
          <div className="absolute bottom-[14%] left-[3%] flex max-w-[320px] items-end gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/20 text-3xl"
              style={{ background: "rgba(255,201,210,0.15)" }}
            >
              {SARAH_EMOJI[emotion]}
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-5 py-4"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            >
              <p className="text-[19px] font-light italic leading-snug text-white/80">
                &ldquo;{beat.sarah}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Beat counter — top right */}
        {!beat.titleCard && !beat.thesisCard && (
          <div className="absolute right-6 top-5 text-[11px] font-medium tabular-nums text-white/25">
            {storyBeatNum} / {storyBeatTotal}
          </div>
        )}

        {/* Advance hint — bottom right (prominent keycaps) */}
        {!beat.titleCard && !beat.thesisCard && (
          <div className="pointer-events-none absolute bottom-7 right-8 flex flex-col items-end gap-3">
            {!isLast ? (
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-white/70">to continue</span>
                <Keycap label="▶" green big />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-[#ff671f]">End of story</span>
              </div>
            )}
            {!isFirst && (
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-medium text-white/40">to go back</span>
                <Keycap label="◀" big />
              </div>
            )}
          </div>
        )}

        {/* Exit hint */}
        <button
          onClick={exitStory}
          className="pointer-events-auto absolute left-3 top-4 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-white/25 transition-colors hover:text-white/50"
        >
          ✕ exit
        </button>
      </div>
    </>
  );
}

function Keycap({ label, green, big }: { label: string; green?: boolean; big?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg font-semibold shadow-md ${
        big ? "h-12 w-12 text-[19px]" : "h-10 w-10 text-[15px]"
      }`}
      style={
        green
          ? { background: "#4ade80", color: "#1a2e1a", boxShadow: "0 3px 0 #16a34a" }
          : { background: "#e5e7eb", color: "#374151", boxShadow: "0 3px 0 #9ca3af" }
      }
    >
      {label}
    </div>
  );
}
