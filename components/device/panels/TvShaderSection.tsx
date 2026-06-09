"use client";

import { useRef } from "react";
import { useApp, DEFAULT_TV_SHADER } from "@/lib/store";
import type { TvShaderParams } from "@/lib/store";

// ── Slider row ─────────────────────────────────────────────────────────────────
function SliderRow({
  label,
  value,
  min, max, step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] text-[#777]">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-8 flex-1 cursor-pointer rounded-lg accent-white"
          style={{
            background: `linear-gradient(to right, #555 0%, #555 ${((value - min) / (max - min)) * 100}%, #2a2a2a ${((value - min) / (max - min)) * 100}%, #2a2a2a 100%)`,
          }}
        />
        <div className="flex w-[52px] shrink-0 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-1.5 text-[12px] tabular-nums text-[#f0f0f0]">
          {fmt ? fmt(value) : String(value)}
        </div>
      </div>
    </div>
  );
}

// ── Color row ──────────────────────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] text-[#777]">{label}</p>
      <div className="flex items-center gap-2">
        {/* Color swatch — click triggers hidden color picker */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#3a3a3a]"
          style={{ background: value }}
          aria-label={`Pick ${label}`}
        >
          <input
            ref={pickerRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>
        {/* Editable hex text */}
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v.toLowerCase());
          }}
          maxLength={7}
          spellCheck={false}
          className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[13px] font-mono uppercase text-[#f0f0f0] outline-none focus:border-[#444]"
        />
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-[#555]">
      {label}
    </p>
  );
}

// ── TvShaderSection ────────────────────────────────────────────────────────────
export function TvShaderSection() {
  const tvShader = useApp((s) => s.tvShader);
  const setTvShader = useApp((s) => s.setTvShader);
  const set = (p: Partial<TvShaderParams>) => setTvShader(p);

  return (
    <div className="flex flex-col gap-3">

      {/* Colors */}
      <ColorRow
        label="Background"
        value={tvShader.bgColor}
        onChange={(v) => set({ bgColor: v })}
      />
      <ColorRow
        label="Dot color"
        value={tvShader.dotColor}
        onChange={(v) => set({ dotColor: v })}
      />

      {/* Dither */}
      <SectionHead label="Dither" />
      <SliderRow
        label="Cell size (px)"
        value={tvShader.cellSize}
        min={4} max={28} step={1}
        onChange={(v) => set({ cellSize: v })}
        fmt={(v) => String(v)}
      />
      <SliderRow
        label="Min dot"
        value={tvShader.minDot}
        min={0} max={0.45} step={0.01}
        onChange={(v) => set({ minDot: v })}
        fmt={(v) => v.toFixed(2)}
      />
      <SliderRow
        label="Max dot"
        value={tvShader.maxDot}
        min={0.1} max={0.5} step={0.01}
        onChange={(v) => set({ maxDot: v })}
        fmt={(v) => v.toFixed(2)}
      />

      {/* Plasma */}
      <SectionHead label="Plasma" />
      <SliderRow
        label="Density"
        value={tvShader.density}
        min={0.5} max={10} step={0.1}
        onChange={(v) => set({ density: v })}
        fmt={(v) => v.toFixed(1)}
      />
      <SliderRow
        label="Contrast"
        value={tvShader.contrast}
        min={0} max={2} step={0.05}
        onChange={(v) => set({ contrast: v })}
        fmt={(v) => v.toFixed(2)}
      />
      <SliderRow
        label="Secondary mix"
        value={tvShader.secMix}
        min={0} max={1} step={0.05}
        onChange={(v) => set({ secMix: v })}
        fmt={(v) => v.toFixed(2)}
      />

      {/* Animation */}
      <SectionHead label="Animation" />
      <SliderRow
        label="Speed"
        value={tvShader.speed}
        min={0} max={0.15} step={0.005}
        onChange={(v) => set({ speed: v })}
        fmt={(v) => v.toFixed(3)}
      />

      {/* Reset */}
      <button
        onClick={() => setTvShader(DEFAULT_TV_SHADER)}
        className="mt-1 flex items-center gap-1.5 text-[12px] text-[#555] hover:text-[#888] active:opacity-70"
      >
        <span>↺</span>
        <span>Reset to defaults</span>
      </button>
    </div>
  );
}
