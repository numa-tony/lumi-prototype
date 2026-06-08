"use client";

import { useApp } from "@/lib/store";

export function SettingsPanel() {
  const resetSession = useApp((s) => s.resetSession);
  const loadDemoData = useApp((s) => s.loadDemoData);
  const threadCount = useApp((s) => s.threads.length);
  const inStay = useApp((s) => s.inStay);
  const setInStay = useApp((s) => s.setInStay);

  return (
    <div className="flex flex-col gap-3 p-5">
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
            <p className="text-[12px] text-[#888]">Shows Doors button on FAB</p>
          </div>
        </div>
        <span
          className={`relative inline-flex h-[24px] w-[42px] shrink-0 rounded-full transition-colors duration-200 ${
            inStay ? "bg-[#ff671f]" : "bg-[#333]"
          }`}
        >
          <span
            className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
              inStay ? "translate-x-[21px]" : "translate-x-[3px]"
            }`}
          />
        </span>
      </button>

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
