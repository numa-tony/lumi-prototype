"use client";

// The iOS home screen — the moment the status stops needing us at all.
//
// The springboard is the real frame exported from Figma (its stock "My App"
// slot painted out), so it reads as an actual phone rather than a drawing of
// one. Only two things are ours: the Numa app tile that takes that slot, and
// the Dynamic Island on top.

import { useApp } from "@/lib/store";
import { useRequestProgress } from "@/lib/demo/request";
import { DynamicIsland } from "./RequestActivity";

const IMG_HOME = "/allhands/ios-home.png";

// Position of the freed app slot, measured off the 402×874 export.
const SLOT = {
  left: `${(30 / 402) * 100}%`,
  top: `${(490 / 874) * 100}%`,
  width: `${(64 / 402) * 100}%`,
};

export function HomeSurface() {
  const request = useApp((s) => s.demo.request);
  const expanded = useApp((s) => s.demo.islandExpanded);
  const progress = useRequestProgress(request);

  return (
    <div className="absolute inset-0 z-[45] overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG_HOME} alt="" className="absolute inset-0 h-full w-full object-fill" />

      {/* Numa, in the slot the export left empty */}
      <div className="absolute" style={SLOT}>
        <div className="relative aspect-square w-full">
          <div className="flex h-full w-full items-center justify-center rounded-[22%] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.28)]">
            <span className="text-[26px] font-bold leading-none tracking-[-1px] text-[#191919]">
              N
            </span>
          </div>
          <span className="absolute -right-[15%] -top-[15%] flex h-[38%] w-[38%] items-center justify-center rounded-full bg-[#ff3b30] text-[11px] font-semibold leading-none text-white">
            1
          </span>
        </div>
        <p className="mt-[7px] text-center text-[11px] font-light leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          Numa
        </p>
      </div>

      <DynamicIsland request={request} progress={progress} expanded={expanded} />
    </div>
  );
}
