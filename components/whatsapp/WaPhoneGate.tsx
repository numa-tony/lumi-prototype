"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { WaPhone } from "./WaPhone";

export function WaPhoneGate() {
  const enabled = useApp((s) => s.wa.enabled);
  const resetCount = useApp((s) => s.wa.resetCount);
  const demoActive = useApp((s) => s.demo.active);

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: "spring", damping: 22, stiffness: 200 }}
          className="flex flex-col items-center"
        >
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-widest text-[#555]">
            WhatsApp
          </p>
          {/* key remounts WaPhone (and thus WaConversation) on reset */}
          <WaPhone key={resetCount} demoActive={demoActive} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
