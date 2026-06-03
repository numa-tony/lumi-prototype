"use client";

import { useState } from "react";

export function Composer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    onSend(t);
    setValue("");
  };

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t border-line bg-surface px-3 pb-5 pt-2.5"
    >
      <div className="flex items-end gap-2 rounded-[26px] border border-line bg-surface px-2 py-1.5">
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint active:bg-surface-muted" aria-label="Attach">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12.5 12.5 21a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder="Ask anything"
          className="max-h-24 flex-1 resize-none bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink-faint"
        />
        {value.trim() ? (
          <button
            type="submit"
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface disabled:opacity-40"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : (
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint active:bg-surface-muted" aria-label="Voice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>
    </form>
  );
}
