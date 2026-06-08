// WhatsApp-style header — green, with iOS status bar row baked in.
export function WaHeader() {
  return (
    <div className="shrink-0 bg-[#075e54] text-white">
      {/* iOS status bar row (white on green) */}
      <div className="flex h-12 items-end justify-between px-7 pb-1">
        <span className="text-[15px] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          {/* signal */}
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 4.5} y={8 - i * 2.5} width="3" height={4 + i * 2.5} rx="1" fill="white" />
            ))}
          </svg>
          {/* wifi */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="white" aria-hidden>
            <path d="M8.5 11.2 6.3 8.5a3.4 3.4 0 0 1 4.4 0L8.5 11.2Z" />
            <path d="M3.8 5.6a7.2 7.2 0 0 1 9.4 0l-1.5 1.8a4.9 4.9 0 0 0-6.4 0L3.8 5.6Z" opacity="0.95" />
            <path d="M1.4 2.9a10.8 10.8 0 0 1 14.2 0l-1.5 1.8a8.5 8.5 0 0 0-11.2 0L1.4 2.9Z" opacity="0.95" />
          </svg>
          {/* battery */}
          <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="white" opacity="0.5" />
            <rect x="2" y="2" width="17" height="9" rx="2" fill="white" />
            <rect x="24" y="4" width="1.6" height="5" rx="0.8" fill="white" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* WA navigation bar */}
      <div className="flex items-center gap-3 px-3 pb-3 pt-1">
        {/* back chevron */}
        <button className="flex items-center gap-0.5 text-white active:opacity-70" aria-label="Back">
          <svg width="11" height="19" viewBox="0 0 11 19" fill="none" stroke="white" strokeWidth="2" aria-hidden>
            <path d="M9.5 1.5 2 9.5l7.5 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px] font-normal">1</span>
        </button>

        {/* avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25d366] text-[16px] font-semibold text-white">
          L
        </div>

        {/* name + status */}
        <div className="flex-1">
          <p className="text-[17px] font-semibold leading-tight text-white">Lumi</p>
          <p className="text-[12px] text-white/70">online</p>
        </div>

        {/* action icons */}
        <div className="flex items-center gap-5">
          <button className="text-white active:opacity-70" aria-label="Video call">
            <svg width="22" height="18" viewBox="0 0 24 20" fill="none" stroke="white" strokeWidth="2" aria-hidden>
              <path d="M15 4H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Z" />
              <path d="m16 7 6-3v12l-6-3V7Z" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="text-white active:opacity-70" aria-label="Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.93-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="text-white active:opacity-70" aria-label="More">
            <svg width="4" height="18" viewBox="0 0 4 20" fill="white" aria-hidden>
              <circle cx="2" cy="2" r="2" />
              <circle cx="2" cy="10" r="2" />
              <circle cx="2" cy="18" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
