import { PhoneFrame } from "@/components/device/PhoneFrame";
import { AppShell } from "@/components/device/AppShell";
import { SidePanel } from "@/components/device/SidePanel";
import { WaPhoneGate } from "@/components/whatsapp/WaPhoneGate";
import { SmartRoomScene } from "@/components/device/SmartRoomScene";
import { FrontDoorScene } from "@/components/device/FrontDoorScene";
import { StoryDirector } from "@/components/demo/StoryDirector";
import { StoryPhoneLabel } from "@/components/demo/StoryPhoneLabel";
import { StoryPhoneShift } from "@/components/demo/StoryPhoneShift";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh bg-[#1a1a1a]">
      <SmartRoomScene />
      <FrontDoorScene />
      <StoryDirector />
      <SidePanel />
      <main className="relative z-10 flex flex-1 items-center justify-center gap-8 overflow-x-auto p-3">
        {/* Lumi app phone */}
        <StoryPhoneShift>
          <StoryPhoneLabel fallback="Lumi App" />
          <PhoneFrame>
            <AppShell />
          </PhoneFrame>
        </StoryPhoneShift>

        {/* WhatsApp phone — shown when WA demo mode is enabled */}
        <WaPhoneGate />
      </main>
    </div>
  );
}
