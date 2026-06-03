import { StatusBar } from "./StatusBar";

// The black-background device shell — a floating iPhone, à la Figma prototype mode.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black p-3">
      <div className="relative aspect-[390/844] h-[min(844px,calc(100dvh-24px))] rounded-[3.2rem] bg-black p-[11px] shadow-[0_0_0_2px_#1c1c1c,0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        {/* screen */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.6rem] bg-surface">
          {/* dynamic island */}
          <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
          <StatusBar />
          {/* app content fills the rest */}
          <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
          {/* home indicator */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[135px] -translate-x-1/2 rounded-full bg-ink/80" />
        </div>
      </div>
    </div>
  );
}
