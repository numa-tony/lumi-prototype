"use client";

import { useApp } from "@/lib/store";

export function StoryPhoneLabel({ fallback }: { fallback: string }) {
  const demoActive = useApp((s) => s.demo.active);
  if (demoActive) return <div className="mb-2 h-[16px]" />;
  return (
    <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-widest text-[#555]">
      {fallback}
    </p>
  );
}
