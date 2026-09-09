"use client";

// The iOS home screen — the moment the status stops needing us at all.
//
// The springboard is the real frame exported from Figma at 3× (`Home Screen -
// iPhone`, 7227:12255), Numa app icon and all, so it reads as an actual phone
// rather than a drawing of one. The only thing drawn over it is the Dynamic
// Island, which has to carry the live countdown.

import { useApp } from "@/lib/store";
import { useRequestProgress } from "@/lib/demo/request";
import { DynamicIsland } from "./RequestActivity";

const IMG_HOME = "/allhands/ios-home.png";

export function HomeSurface() {
  const request = useApp((s) => s.demo.request);
  const expanded = useApp((s) => s.demo.islandExpanded);
  const progress = useRequestProgress(request);

  return (
    <div className="absolute inset-0 z-[45] overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG_HOME} alt="" className="absolute inset-0 h-full w-full object-fill" />
      <DynamicIsland request={request} progress={progress} expanded={expanded} />
    </div>
  );
}
