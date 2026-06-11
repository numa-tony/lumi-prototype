"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { Waveform } from "./Waveform";

// Presentational, scripted voice mode for Story Mode. Mirrors VoiceSheet's look
// but reads entirely from demo.storyVoice — no mic, no useChat, no API calls.
export function StoryVoiceView() {
  const voice = useApp((s) => s.demo.storyVoice);
  const closeStoryVoice = useApp((s) => s.closeStoryVoice);

  const listening = voice.mode === "listening";
  const speaking = voice.mode === "speaking";

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-white"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
    >
      {/* Top bar */}
      <div className="relative flex shrink-0 items-center justify-center pt-[56px] pb-3">
        <p className="text-[22px] font-semibold tracking-[-0.4px] text-[#191919]">Numa</p>
        <button
          onClick={closeStoryVoice}
          className="absolute right-4 top-[52px] flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[#191919]/60 active:bg-black/10"
          aria-label="Close voice"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="m6 18 12-12M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Center — torus + status */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <motion.div
          animate={speaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={speaking ? { duration: 1.6, ease: "easeInOut", repeat: Infinity } : { duration: 0.3 }}
          className="relative h-[260px] w-[260px]"
        >
          <Image src="/lumi-torus.png" alt="Lumi" fill className="object-contain" priority />
        </motion.div>

        {/* Status label */}
        <div className="flex min-h-[72px] flex-col items-center justify-center gap-2 px-8">
          {listening && !voice.transcript && (
            <p className="text-center text-[14px] text-[#191919]/40">Listening…</p>
          )}

          {listening && voice.transcript && (
            <p className="max-w-[280px] text-center text-[20px] font-light leading-snug text-[#191919]/85">
              {voice.transcript}
              <span className="ml-0.5 inline-block h-[18px] w-[2px] animate-pulse bg-[#191919]/40 align-middle" />
            </p>
          )}

          {speaking && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13px] font-semibold tracking-[-0.2px] text-[color:var(--color-numa)]">Lumi</p>
              {voice.response && (
                <p className="max-w-[280px] text-center text-[16px] leading-relaxed text-[#191919]/75">
                  {voice.response}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom — waveform card (visible while listening) */}
      <AnimatePresence>
        {listening && (
          <motion.div
            className="shrink-0 px-4 pb-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="mb-2.5 flex items-center justify-center gap-1 text-[#191919]/25">
              <span className="text-[12px] font-light tracking-[-0.2px]">Listening to you…</span>
            </div>

            <div
              className="relative overflow-hidden rounded-[24px] border border-white/60 p-4"
              style={{ background: "rgba(255,201,210,0.2)", boxShadow: "0px 10px 40px rgba(0,0,0,0.1)" }}
            >
              <div
                className="pointer-events-none absolute -left-24 -top-14 h-[327px] w-[327px] rounded-full"
                style={{ background: "rgba(255,150,200,0.3)", filter: "blur(40px)" }}
              />
              <div
                className="pointer-events-none absolute -right-16 -top-14 h-[271px] w-[271px] rounded-full"
                style={{ background: "rgba(180,140,255,0.25)", filter: "blur(36px)" }}
              />
              <div className="relative">
                <Waveform active analyser={null} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
