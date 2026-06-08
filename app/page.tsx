import { PhoneFrame } from "@/components/device/PhoneFrame";
import { AppShell } from "@/components/device/AppShell";
import { SidePanel } from "@/components/device/SidePanel";

export default function Home() {
  return (
    <div className="flex min-h-dvh bg-[#1a1a1a]">
      <SidePanel />
      <main className="flex flex-1 items-center justify-center p-3">
        <PhoneFrame>
          <AppShell />
        </PhoneFrame>
      </main>
    </div>
  );
}
