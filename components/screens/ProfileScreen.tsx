"use client";

const MENU_ROWS = [
  {
    label: "Personal details",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
      </svg>
    ),
    chevron: true,
  },
  {
    label: "Settings",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    chevron: true,
  },
  {
    label: "Manage stays",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 7v13M21 7v13M3 12h18M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4" />
        <path d="M9 12v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    chevron: true,
  },
  {
    label: "Security",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    chevron: true,
  },
  {
    label: "Privacy",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    chevron: true,
  },
  {
    label: "Logout",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    chevron: false,
  },
];

export function ProfileScreen() {
  return (
    <div className="pb-40">
      {/* Pink header */}
      <div className="bg-[var(--color-lumi-pink)] px-6 pb-14 pt-[72px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.2px] text-text">
              Sarah Numan
            </h1>
            <p className="mt-1 text-[18px] font-light leading-6 tracking-[-0.2px] text-text">
              Numa member
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-full bg-[#9162CA] px-3 py-1 text-[13px] font-semibold leading-5 text-white">
            Since 2024
          </span>
        </div>
      </div>

      {/* Savings card — overlaps header */}
      <div className="mx-6 -mt-8 relative z-10 flex items-start justify-between rounded-[8px] bg-white p-4 shadow-[0px_10px_40px_rgba(0,0,0,0.10)]">
        <div>
          <p className="text-[20px] font-semibold leading-7 tracking-[-0.2px] text-text">€130</p>
          <p className="mt-0.5 text-[16px] font-light leading-5 tracking-[-0.2px] text-text-secondary">
            Membership savings
          </p>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-secondary" aria-label="More info">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
      </div>

      {/* Menu list */}
      <div className="mt-6 px-6 flex flex-col gap-0">
        {MENU_ROWS.map((row) => (
          <button
            key={row.label}
            className="flex w-full items-center gap-4 py-2 text-left active:bg-surface-muted"
          >
            <div className="shrink-0 py-2 text-text">
              {row.icon}
            </div>
            <span className="flex-1 py-2 text-[14px] font-light leading-[1.3] tracking-[-0.2px] text-text">
              {row.label}
            </span>
            {row.chevron && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-secondary" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
