"use client";

// Swaps the phone's contents between the Numa app and the surfaces that sit
// outside it (WhatsApp, iOS home, iOS lock). Mounted inside PhoneFrame so the
// surfaces are clipped by the same bezel as the app.
//
// The move reads like an iOS app switch: the incoming surface zooms up into
// place. Deliberately a plain CSS transition rather than a motion component —
// this layer is mounted from a server component and must never fail to appear
// on stage, whatever the animation library is doing.

import { useApp } from "@/lib/store";
import { WhatsAppSurface } from "./WhatsAppSurface";
import { HomeSurface } from "./HomeSurface";
import { LockSurface } from "./LockSurface";

export function PhoneSurface() {
  const active = useApp((s) => s.demo.active);
  const surface = useApp((s) => s.demo.surface);

  const show = active && surface !== "app";

  if (!show) return null;

  // `key` restarts the zoom whenever the surface changes.
  return (
    <div key={surface} className="surface-enter absolute inset-0 z-[45]">
      {surface === "whatsapp" && <WhatsAppSurface />}
      {surface === "home" && <HomeSurface />}
      {surface === "lock" && <LockSurface />}
    </div>
  );
}
