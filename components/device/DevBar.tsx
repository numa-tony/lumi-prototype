"use client";

import { useApp } from "@/lib/store";

// Lives outside the iPhone frame on the black background. It's an obvious
// dev/demo control, not part of the app UI — used to reset to "first visit"
// state for repeat demos, and to seed the showcase threads on demand.
export function DevBar() {
  const resetSession = useApp((s) => s.resetSession);
  const loadDemoData = useApp((s) => s.loadDemoData);
  const threadCount = useApp((s) => s.threads.length);
  const inStay = useApp((s) => s.inStay);
  const setInStay = useApp((s) => s.setInStay);

  return (
    <div className="fixed left-4 top-4 z-50 flex flex-col gap-2 text-[13px]">
      <button
        onClick={resetSession}
        className="rounded-md bg-[#ffc9d2] px-3 py-2 font-semibold text-[#191919] shadow-lg active:scale-95"
      >
        Reset session
      </button>
      <button
        onClick={loadDemoData}
        className="rounded-md bg-white/10 px-3 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur active:scale-95"
      >
        Load demo threads
      </button>

      {/* In stay mode toggle */}
      <button
        role="switch"
        aria-checked={inStay}
        onClick={() => setInStay(!inStay)}
        className="flex items-center justify-between gap-3 rounded-md bg-white/10 px-3 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur active:scale-95"
      >
        <span>In stay mode</span>
        <span
          className={`relative inline-flex h-[20px] w-[36px] shrink-0 rounded-full transition-colors duration-200 ${
            inStay ? "bg-fuchsia-400" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
              inStay ? "translate-x-[18px]" : "translate-x-[2px]"
            }`}
          />
        </span>
      </button>

      <p className="px-1 pt-1 text-[11px] font-light text-white/40">
        {threadCount} thread{threadCount === 1 ? "" : "s"} in session
      </p>
    </div>
  );
}
