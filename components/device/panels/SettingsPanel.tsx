"use client";

import { useApp } from "@/lib/store";
import { INITIAL_SMART_ROOM } from "@/lib/smartRoom";
import { WaScenarioPanel } from "./WaScenarioPanel";
import { TvShaderSection } from "./TvShaderSection";

export function SettingsPanel() {
  const resetSession = useApp((s) => s.resetSession);
  const loadDemoData = useApp((s) => s.loadDemoData);
  const threadCount = useApp((s) => s.threads.length);
  const inStay = useApp((s) => s.inStay);
  const setInStay = useApp((s) => s.setInStay);
  const setSmartRoom = useApp((s) => s.setSmartRoom);
  const waEnabled = useApp((s) => s.wa.enabled);
  const setWaEnabled = useApp((s) => s.setWaEnabled);
  const resetWa = useApp((s) => s.resetWa);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#555]">
        Demo Controls
      </p>

      <button
        onClick={loadDemoData}
        className="flex w-full items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-3.5 text-left transition-colors hover:bg-[#252525] active:scale-[0.99]"
      >
        <span className="text-xl leading-none">🗂️</span>
        <div>
          <p className="text-[14px] font-semibold text-[#f0f0f0]">Load demo threads</p>
          <p className="text-[12px] text-[#888]">Seed the Messages inbox with showcase data</p>
        </div>
      </button>

      <button
        role="switch"
        aria-checked={inStay}
        onClick={() => setInStay(!inStay)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-3.5 transition-colors hover:bg-[#252525] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">🏠</span>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-[#f0f0f0]">In-stay mode</p>
            <p className="text-[12px] text-[#888]">Doors button + smart-room scene behind phone</p>
          </div>
        </div>
        <Toggle on={inStay} />
      </button>

      {/* Reset room — only relevant when in-stay mode is on */}
      {inStay && (
        <button
          onClick={() => setSmartRoom(INITIAL_SMART_ROOM)}
          className="flex w-full items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-3 text-left transition-colors hover:bg-[#252525] active:scale-[0.99]"
        >
          <span className="text-xl leading-none">🌙</span>
          <div>
            <p className="text-[14px] font-semibold text-[#f0f0f0]">Reset room</p>
            <p className="text-[12px] text-[#888]">Lights off, blinds closed, TV off</p>
          </div>
        </button>
      )}

      {/* WhatsApp demo mode toggle */}
      <button
        role="switch"
        aria-checked={waEnabled}
        onClick={() => setWaEnabled(!waEnabled)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-3.5 transition-colors hover:bg-[#252525] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">💬</span>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-[#f0f0f0]">WhatsApp demo mode</p>
            <p className="text-[12px] text-[#888]">Shows a second phone — Sarah&apos;s WhatsApp</p>
          </div>
        </div>
        <Toggle on={waEnabled} />
      </button>

      {/* Sarah's day scenario panel — only when WA is enabled */}
      {waEnabled && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#171717] p-4">
          <WaScenarioPanel />
          <div className="mt-4 border-t border-[#2a2a2a] pt-3">
            <button
              onClick={resetWa}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-[#555] hover:text-[#888] active:opacity-70"
            >
              <span>↺</span>
              <span>Reset WhatsApp conversation</span>
            </button>
          </div>
        </div>
      )}

      {/* Channel asymmetry legend */}
      {waEnabled && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#171717] px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#555]">
            Channel model
          </p>
          <div className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[#25d366]">WhatsApp → Lumi</span>
              <span className="text-[#444]">pulls in, creates threads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#555] line-through">Lumi → WhatsApp</span>
              <span className="text-[#444]">app stays silent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#4a7fa3]">Lumi-initiated</span>
              <span className="text-[#444]">fires to both surfaces</span>
            </div>
          </div>
        </div>
      )}

      {/* TV Shader inspector */}
      <div className="rounded-xl border border-[#2a2a2a] bg-[#171717] px-4 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#555]">
          📺 TV Shader
        </p>
        <TvShaderSection />
      </div>

      <button
        onClick={resetSession}
        className="flex w-full items-center gap-3 rounded-xl border border-[#ffc9d2]/20 bg-[#ffc9d2]/8 px-4 py-3.5 text-left transition-colors hover:bg-[#ffc9d2]/15 active:scale-[0.99]"
      >
        <span className="text-xl leading-none">🔄</span>
        <div>
          <p className="text-[14px] font-semibold text-[#f0f0f0]">Reset session</p>
          <p className="text-[12px] text-[#888]">
            {threadCount > 0
              ? `Clears ${threadCount} thread${threadCount === 1 ? "" : "s"} · returns to Explore`
              : "Returns to clean Explore state"}
          </p>
        </div>
      </button>

      <p className="px-1 pt-1 text-[11px] text-[#555]">
        {threadCount} thread{threadCount === 1 ? "" : "s"} in session · Press Esc to reset
      </p>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-[24px] w-[42px] shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-[#ff671f]" : "bg-[#333]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-[21px]" : "translate-x-[3px]"
        }`}
      />
    </span>
  );
}
