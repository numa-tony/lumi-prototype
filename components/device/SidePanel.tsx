"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { SettingsPanel } from "./panels/SettingsPanel";

type ModalView = "settings" | null;
type NavAction = ModalView | "story";

function StoryDemoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <polygon points="3,1.5 13,7.5 3,13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.93 2.93l1.06 1.06M11.01 11.01l1.06 1.06M2.93 12.07l1.06-1.06M11.01 3.99l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV: {
  id: string;
  label: string;
  Icon: () => React.ReactElement;
  action: NavAction;
}[] = [
  { id: "story", label: "Sarah's Day", Icon: StoryDemoIcon, action: "story" },
  { id: "settings", label: "Settings", Icon: SettingsIcon, action: "settings" },
];

export function SidePanel() {
  const [modal, setModal] = useState<ModalView>(null);
  const demoActive = useApp((s) => s.demo.active);
  const startStory = useApp((s) => s.startStory);

  const handleNav = (action: NavAction) => {
    if (action === "story") { startStory(); return; }
    if (action === "settings") setModal(action);
  };

  return (
    <>
      {/* Permanent sidebar — hidden in story mode */}
      <aside
        className="relative z-20 flex w-[210px] shrink-0 flex-col px-6 py-8 transition-opacity duration-300"
        style={{ opacity: demoActive ? 0 : 1, pointerEvents: demoActive ? "none" : "auto" }}
      >
        <div className="mb-5">
          <h1 className="text-[28px] font-bold leading-none tracking-tight text-white">
            Numa
          </h1>
          <p className="mt-1.5 text-[12px] text-[#666]">Lumi UX Vision</p>
          <div className="mt-5 h-px bg-[#2d2d2d]" />
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ id, label, Icon, action }) => (
            <button
              key={id}
              onClick={() => handleNav(action)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                id === "story"
                  ? "text-[#ff671f] hover:bg-[#ff671f]/10 hover:text-[#ff8040]"
                  : "text-[#999] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Modal overlay */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/70"
              onClick={() => setModal(null)}
            />

            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed left-1/2 top-1/2 z-[60] flex max-h-[80vh] w-[680px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[#252525] shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setModal(null)}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1a1a1a] shadow-md transition-colors hover:bg-gray-100 active:scale-95"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M1 1l9 9M10 1L1 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <SettingsPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
