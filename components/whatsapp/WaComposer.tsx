"use client";

import { useState } from "react";

export function WaComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue("");
  };

  return (
    <div className="shrink-0 flex items-center gap-2 bg-[#f0f0f0] px-3 py-2">
      {/* emoji button */}
      <button className="shrink-0 text-[#8a8a8a] active:opacity-70" aria-label="Emoji">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 13s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
          <circle cx="9" cy="10" r="0.5" fill="currentColor" />
          <circle cx="15" cy="10" r="0.5" fill="currentColor" />
        </svg>
      </button>

      {/* input */}
      <div className="flex flex-1 items-center rounded-full bg-white px-4 py-2 shadow-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="Message"
          disabled={disabled}
          className="flex-1 bg-transparent text-[14px] text-[#111] outline-none placeholder:text-[#aaa]"
        />
        {/* attach */}
        <button className="ml-1 text-[#8a8a8a] active:opacity-70" aria-label="Attach">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* camera */}
        <button className="ml-2 text-[#8a8a8a] active:opacity-70" aria-label="Camera">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>

      {/* send / mic */}
      <button
        onClick={value.trim() ? submit : undefined}
        disabled={disabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow active:opacity-75 disabled:opacity-40"
        aria-label={value.trim() ? "Send" : "Voice message"}
      >
        {value.trim() ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden>
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
