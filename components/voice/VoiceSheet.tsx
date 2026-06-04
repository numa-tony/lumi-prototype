"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useApp } from "@/lib/store";
import { Waveform } from "./Waveform";
import Image from "next/image";

const VOICE_HINT =
  "The guest is in voice mode. Your response will be read aloud by text-to-speech. " +
  "Rules: reply in 1–2 short sentences maximum — no bullet lists, no headers, no markdown. " +
  "Give your spoken answer first, then call any widget if needed. " +
  "Sound like you are talking to the guest, not writing to them.";

type VoiceState = "idle" | "recording" | "processing" | "speaking";

// ── WAV encoder ───────────────────────────────────────────────────────────────
// Converts any MediaRecorder blob (webm / mp4 / ogg) to WAV PCM16 via
// AudioContext.decodeAudioData so Gemini STT always receives a supported format.
async function toWav(blob: Blob): Promise<Blob> {
  const ab = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(ab);
  } finally {
    audioCtx.close();
  }

  const numCh = decoded.numberOfChannels;
  const sr = decoded.sampleRate;
  const len = decoded.length;
  const bps = 2; // 16-bit PCM
  const dataSize = len * numCh * bps;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);

  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * bps, true);
  v.setUint16(32, numCh * bps, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, decoded.getChannelData(ch)[i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: "audio/wav" });
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="lumi-typing flex items-center gap-1">
      <span />
      <span />
      <span />
    </div>
  );
}

// ── VoiceSheet ────────────────────────────────────────────────────────────────
export function VoiceSheet() {
  const closeVoice = useApp((s) => s.closeVoice);
  const createThread = useApp((s) => s.createThread);
  const saveThreadMessages = useApp((s) => s.saveThreadMessages);
  const renameThread = useApp((s) => s.renameThread);

  const [voiceState, setVoiceStateRaw] = useState<VoiceState>("idle");
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const voiceStateRef = useRef<VoiceState>("idle");
  const threadIdRef = useRef<string | null>(null);
  const namedRef = useRef(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Silence-detection timer: auto-send if no loud audio for SILENCE_MS
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SILENCE_MS = 2200;

  const setVoiceState = useCallback((s: VoiceState) => {
    voiceStateRef.current = s;
    setVoiceStateRaw(s);
  }, []);

  // ── AI chat hook ────────────────────────────────────────────────────────────
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { hint: VOICE_HINT },
    }),
    onFinish: ({ messages: latest }) => {
      if (threadIdRef.current) saveThreadMessages(threadIdRef.current, latest);

      const lastAI = [...latest].reverse().find((m) => m.role === "assistant");
      let responseText = "";
      if (lastAI) {
        responseText = lastAI.parts
          .filter((p) => p.type === "text")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p) => (p as any).text as string)
          .join(" ")
          .trim();
        if (!responseText && typeof (lastAI as unknown as { content?: string }).content === "string") {
          responseText = ((lastAI as unknown as { content: string }).content).trim();
        }
      }

      if (responseText) {
        setVoiceState("speaking");
        setStatusLabel(responseText);
        void speakWithGemini(responseText).then(() => {
          setVoiceState("idle");
          setStatusLabel(null);
        });
      } else {
        setVoiceState("idle");
        setErrorMsg("Lumi didn't respond. Try again.");
      }
    },
  });

  // Detect setThreadTopic tool calls
  useEffect(() => {
    if (namedRef.current || !threadIdRef.current) return;
    for (const m of messages) {
      for (const part of m.parts) {
        if (part.type !== "tool-setThreadTopic") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any;
        if (p.state !== "output-available") continue;
        const { topic, emoji } = p.output ?? {};
        if (typeof topic === "string" || typeof emoji === "string") {
          renameThread(threadIdRef.current!, topic ?? "", emoji);
          namedRef.current = true;
        }
        return;
      }
    }
  }, [messages, renameThread]);

  // ── Browser TTS fallback ─────────────────────────────────────────────────────
  const browserSpeak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Ava") ||
              v.name.includes("Samantha") ||
              v.name.includes("Google UK English Female") ||
              v.name.includes("Google US English")),
        );
        if (preferred) utterance.voice = preferred;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      }, 80);
    });
  }, []);

  // ── Gemini TTS ───────────────────────────────────────────────────────────────
  const speakWithGemini = useCallback(
    async (text: string): Promise<void> => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return browserSpeak(text);
        const blob = await res.blob();
        if (!blob.size) return browserSpeak(text);
        return new Promise((resolve) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioElRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); browserSpeak(text).then(resolve); };
          audio.play().catch(() => { URL.revokeObjectURL(url); browserSpeak(text).then(resolve); });
        });
      } catch {
        return browserSpeak(text);
      }
    },
    [browserSpeak],
  );

  // ── Send transcript to AI ────────────────────────────────────────────────────
  const doSend = useCallback(
    (text: string) => {
      if (!threadIdRef.current) threadIdRef.current = createThread(text);
      setStatusLabel(`You: ${text}`);
      setVoiceState("processing");
      sendMessage({ text });
    },
    [createThread, sendMessage, setVoiceState],
  );

  // ── Silence detection loop ───────────────────────────────────────────────────
  const startSilenceDetection = useCallback((sendFn: () => void) => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      if (voiceStateRef.current !== "recording") return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;

      if (avg > 8) {
        // Sound detected — reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(sendFn, SILENCE_MS);
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }, []);

  // ── Cleanup audio pipeline ───────────────────────────────────────────────────
  const teardownAudio = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Start recording ──────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setErrorMsg(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as Error)?.name ?? "";
      setErrorMsg(
        name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Microphone blocked — allow it in browser settings."
          : "Could not access microphone.",
      );
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    // Wire up AnalyserNode for real waveform + silence detection
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    // Pick best supported MIME type (Safari → mp4, Chrome → webm)
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
      "video/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setVoiceState("recording");

    // Start silence-detection → auto-send
    startSilenceDetection(() => void sendRecordingInternal(recorder));
  }, [setVoiceState, startSilenceDetection]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send recording (internal — called by silence detection OR manual button) ─
  const sendRecordingInternal = useCallback(
    async (recorder: MediaRecorder) => {
      if (recorder.state === "inactive") return;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setVoiceState("processing");
      setStatusLabel("Transcribing…");

      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        };
        recorder.stop();
      });
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      teardownAudio();

      if (blob.size < 1000) {
        setVoiceState("idle");
        setErrorMsg("No audio captured. Tap to try again.");
        return;
      }

      try {
        const wavBlob = await toWav(blob);
        const audioBase64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onloadend = () => res((reader.result as string).split(",")[1]);
          reader.onerror = rej;
          reader.readAsDataURL(wavBlob);
        });

        const resp = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64, mimeType: "audio/wav" }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const { transcript } = (await resp.json()) as { transcript: string };

        if (!transcript?.trim()) {
          setVoiceState("idle");
          setErrorMsg("Couldn't understand that. Try again.");
          return;
        }
        doSend(transcript.trim());
      } catch {
        setVoiceState("idle");
        setErrorMsg("Something went wrong. Try again.");
      }
    },
    [setVoiceState, teardownAudio, doSend],
  );

  // ── Public send (called by ✓ button / swipe-up) ───────────────────────────────
  const sendRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec) void sendRecordingInternal(rec);
  }, [sendRecordingInternal]);

  // ── Cancel ───────────────────────────────────────────────────────────────────
  const cancelRecording = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.ondataavailable = null;
      rec.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    teardownAudio();
    setVoiceState("idle");
  }, [setVoiceState, teardownAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioElRef.current?.pause();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.ondataavailable = null;
        rec.stop();
      }
      teardownAudio();
    };
  }, [teardownAudio]);

  const isListening = voiceState === "recording";
  const showCard = voiceState === "recording";

  // ── Render ───────────────────────────────────────────────────────────────────
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
          onClick={closeVoice}
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
          animate={voiceState === "speaking" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
          className="relative h-[260px] w-[260px]"
        >
          <Image src="/lumi-torus.png" alt="Lumi" fill className="object-contain" priority />
        </motion.div>

        {/* Status label */}
        <div className="flex min-h-[60px] flex-col items-center justify-center gap-2 px-8">
          {voiceState === "recording" && (
            <p className="text-center text-[14px] text-[#191919]/40">Listening…</p>
          )}

          {voiceState === "processing" && (
            <div className="flex flex-col items-center gap-2">
              <ThinkingDots />
              {statusLabel && (
                <p className="max-w-[240px] text-center text-[12px] leading-relaxed text-[#191919]/40">
                  {statusLabel}
                </p>
              )}
            </div>
          )}

          {voiceState === "speaking" && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13px] font-semibold text-[color:var(--color-numa)] tracking-[-0.2px]">Lumi</p>
              {statusLabel && (
                <p className="text-center text-[14px] leading-relaxed text-[#191919]/70">
                  {statusLabel}
                </p>
              )}
            </div>
          )}

          {voiceState === "idle" && errorMsg && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-[12px] leading-relaxed text-red-500/80">{errorMsg}</p>
              <button
                onClick={() => void startRecording()}
                className="flex items-center gap-2 rounded-full bg-[#191919] px-6 py-3 text-[14px] font-semibold text-white active:opacity-75"
              >
                Tap to speak
              </button>
            </div>
          )}

          {voiceState === "idle" && !errorMsg && (
            <button
              onClick={() => void startRecording()}
              className="flex items-center gap-2 rounded-full bg-[#191919] px-6 py-3 text-[14px] font-semibold text-white active:opacity-75"
            >
              Tap to speak
            </button>
          )}
        </div>
      </div>

      {/* Bottom — waveform card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            className="shrink-0 px-4 pb-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="mb-2.5 flex items-center justify-center gap-1 text-[#191919]/25">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[12px] font-light tracking-[-0.2px]">Swipe up to send</span>
            </div>

            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) cancelRecording();
                else if (info.offset.y < -60) sendRecording();
              }}
              whileDrag={{ scale: 1.02 }}
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
                <Waveform active={isListening} analyser={analyserRef.current} />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={cancelRecording}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 text-[#191919]/50 active:bg-black/5"
                  aria-label="Cancel"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="m6 18 12-12M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>

                <div className="flex items-center gap-1 text-[#191919]/30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[11px] font-light tracking-[-0.2px]">Swipe left to cancel</span>
                </div>

                <button
                  onClick={sendRecording}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#191919] text-white active:scale-95"
                  aria-label="Send"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
