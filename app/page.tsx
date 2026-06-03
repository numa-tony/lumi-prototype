import { PhoneFrame } from "@/components/device/PhoneFrame";
import { AppShell } from "@/components/device/AppShell";
import { DevBar } from "@/components/device/DevBar";

export default function Home() {
  return (
    <>
      <DevBar />
      <PhoneFrame>
        <AppShell />
      </PhoneFrame>
    </>
  );
}
