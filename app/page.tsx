import { PhoneFrame } from "@/components/device/PhoneFrame";
import { AppShell } from "@/components/device/AppShell";
import { SidePanel } from "@/components/device/SidePanel";
import { WaPhoneGate } from "@/components/whatsapp/WaPhoneGate";

export default function Home() {
  return (
    <div className="flex min-h-dvh bg-[#1a1a1a]">
      <SidePanel />
      <main className="flex flex-1 items-center justify-center gap-8 overflow-x-auto p-3">
        {/* Lumi app phone */}
        <div className="flex shrink-0 flex-col items-center">
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-widest text-[#555]">
            Lumi App
          </p>
          <PhoneFrame>
            <AppShell />
          </PhoneFrame>
        </div>

        {/* WhatsApp phone — shown when WA demo mode is enabled */}
        <WaPhoneGate />
      </main>
    </div>
  );
}
