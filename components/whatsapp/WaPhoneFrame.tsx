// iPhone shell styled for WhatsApp — same outer dimensions as PhoneFrame but
// with a WA wallpaper background instead of bg-surface.
export function WaPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[390/844] h-[min(844px,calc(100dvh-24px))] rounded-[3.2rem] bg-black p-[11px] shadow-[0_0_0_2px_#1c1c1c,0_30px_80px_-20px_rgba(0,0,0,0.8)]">
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.6rem] bg-[#efeae2]">
        {/* notch */}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        {/* home indicator */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[135px] -translate-x-1/2 rounded-full bg-black/20" />
      </div>
    </div>
  );
}
