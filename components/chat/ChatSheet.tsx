"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { ThreadView } from "./ThreadView";
import { StoryThreadView } from "./StoryThreadView";

export function ChatSheet() {
  const chat = useApp((s) => s.chat);
  const closeChat = useApp((s) => s.closeChat);
  const demoActive = useApp((s) => s.demo.active);
  const thread = useApp((s) =>
    chat?.threadId ? s.threads.find((t) => t.id === chat.threadId) : undefined,
  );

  return (
    <AnimatePresence>
      {chat && (
        <motion.div
          className="absolute inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop — non-interactive in story mode so keyboard events still reach StoryDirector */}
          {!demoActive && (
            <button
              onClick={closeChat}
              aria-label="Close"
              className="absolute inset-0 bg-black/30"
            />
          )}
          {/* sheet */}
          <motion.div
            className="absolute inset-x-0 bottom-0 top-[10px] flex flex-col overflow-hidden rounded-t-[38px] bg-surface shadow-[0px_15px_75px_0px_rgba(0,0,0,0.18)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {/* grabber */}
            <div className="flex shrink-0 justify-center pt-3">
              <span className="h-[5px] w-9 rounded-full bg-[#ccc]" />
            </div>

            {demoActive
              ? <StoryThreadView onClose={closeChat} />
              : <ThreadView key={chat.threadId ?? chat.kind} context={chat} thread={thread} onClose={closeChat} />
            }
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
