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
  //
  // z-[55] puts these surfaces above the whole app, chat sheet included (z-50,
  // in the same stacking context). They are what the phone is showing *instead
  // of* the app, so the app — sheet and all — stays alive underneath: going
  // home from a chat doesn't close it, and coming back lands straight in it.
  // The island and the lock-screen activity live inside the surfaces, so they
  // come along.
  return (
    <div key={surface} className="surface-enter absolute inset-0 z-[55]">
      {surface === "whatsapp" && <WhatsAppSurface />}
      {surface === "home" && <HomeSurface />}
      {surface === "lock" && <LockSurface />}
    </div>
  );
}
