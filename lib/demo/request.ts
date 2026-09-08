"use client";

// A live service request — the single model behind three renderings:
//   1. the pinned status card at the top of the Lumi thread
//   2. the Dynamic Island (compact + expanded) on the iOS home screen
//   3. the Live Activity widget on the iOS lock screen
//
// All three read the same countdown, so the number Sarah sees never disagrees
// with itself as the presenter moves between surfaces.

import { useEffect, useState } from "react";

export interface RequestState {
  title: string;
  detail: string;         // "Arriving in ~30 min" is derived; this is the fallback line
  receivedLabel: string;  // "9:41 PM"
  receivedCaption: string; // "Ticket Received"
  etaLabel: string;       // "10:11 PM"
  etaCaption: string;     // "Estimated Resolution"
  totalMinutes: number;   // 30
  startedAt: number;      // Date.now() when the request was opened
}

// The AC request Sarah opens on WhatsApp in Beat 01. Times are pinned to the
// phone's fixed 9:41 clock so the ticket is never ahead of its own ETA.
export function createAcRequest(): RequestState {
  return {
    title: "Technician on the way",
    detail: "Arriving in ~30 min",
    receivedLabel: "9:41 PM",
    receivedCaption: "Ticket Received",
    etaLabel: "10:11 PM",
    etaCaption: "Estimated Resolution",
    totalMinutes: 30,
    startedAt: Date.now(),
  };
}

export interface RequestProgress {
  minutesLeft: number;  // rounded up, floored at 1
  progress: number;     // 0–1, elapsed share of totalMinutes
  etaText: string;      // "Arriving in ~30 min"
  shortText: string;    // "30m" — for the compact island
  longText: string;     // "Arriving in 30 minutes"
}

export function requestProgress(req: RequestState, now: number): RequestProgress {
  const elapsedMs = Math.max(0, now - req.startedAt);
  const totalMs = req.totalMinutes * 60_000;
  const progress = Math.min(1, elapsedMs / totalMs);
  const minutesLeft = Math.max(1, Math.ceil((totalMs - elapsedMs) / 60_000));
  return {
    minutesLeft,
    progress,
    etaText: `Arriving in ~${minutesLeft} min`,
    shortText: `${minutesLeft}m`,
    longText: `Arriving in ${minutesLeft} minutes`,
  };
}

// Ticks once a second so the countdown visibly moves during the talk. Returns
// null when no request is open.
export function useRequestProgress(req: RequestState | null): RequestProgress | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!req) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [req]);

  if (!req) return null;
  return requestProgress(req, now);
}
