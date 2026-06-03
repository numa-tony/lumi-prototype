"use client";

import { useRef, useEffect } from "react";

interface WaveformProps {
  /** true = user is speaking (animated bars); false = idle (small scrolling dots) */
  active: boolean;
}

const COLS = 52;
const COL_W = 3;
const COL_GAP = 3;
const MAX_BAR_H = 38;
const DOT_H = 3;
const UPDATE_MS = 55; // ~18fps

export function Waveform({ active }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const bufferRef = useRef<number[]>(Array(COLS).fill(DOT_H));
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || 320;
      const cssH = canvas.clientHeight || 52;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      const cy = cssH / 2;
      bufferRef.current.forEach((h, i) => {
        const x = i * (COL_W + COL_GAP);
        const y = cy - h / 2;
        ctx.fillStyle = `rgba(25,25,25,${0.25 + (h / MAX_BAR_H) * 0.55})`;
        ctx.beginPath();
        ctx.roundRect(x, y, COL_W, Math.max(DOT_H, h), COL_W / 2);
        ctx.fill();
      });
    };

    if (prefersReduced) {
      render();
      return;
    }

    const loop = (time: number) => {
      if (time - lastTimeRef.current > UPDATE_MS) {
        lastTimeRef.current = time;

        let newH = DOT_H;
        if (active) {
          // Combine three sine waves at different frequencies + a small random component
          // so each new column looks naturally different as it scrolls left.
          const t = time / 1000;
          const amp =
            Math.sin(t * 2.3) * 0.28 +
            Math.sin(t * 6.1) * 0.18 +
            Math.sin(t * 13.7) * 0.08 +
            (Math.random() - 0.5) * 0.12 +
            0.44; // baseline keeps bars clearly visible
          newH = Math.max(DOT_H, Math.round(Math.min(1, amp) * MAX_BAR_H));
        }

        bufferRef.current = [...bufferRef.current.slice(1), newH];
        render();
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[52px] w-full"
      style={{ display: "block" }}
    />
  );
}
