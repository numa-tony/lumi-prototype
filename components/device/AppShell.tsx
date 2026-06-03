"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import type { ScreenId } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { Fab } from "@/components/nav/Fab";
import { ChatSheet } from "@/components/chat/ChatSheet";
import { VoiceSheet } from "@/components/voice/VoiceSheet";
import { BookingSheet } from "@/components/booking/BookingSheet";
import { ExploreScreen } from "@/components/screens/ExploreScreen";
import { MyTripsScreen } from "@/components/screens/MyTripsScreen";
import { TripDetailScreen } from "@/components/screens/TripDetailScreen";
import { MessagesScreen } from "@/components/screens/MessagesScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";

const SCREENS: Record<ScreenId, React.ComponentType> = {
  explore: ExploreScreen,
  trips: MyTripsScreen,
  tripDetail: TripDetailScreen,
  messages: MessagesScreen,
  profile: ProfileScreen,
};

export function AppShell() {
  const screen = useApp((s) => s.screen);
  const voiceOpen = useApp((s) => s.voiceOpen);
  const bookingOpen = useApp((s) => s.bookingOpen);
  const Active = SCREENS[screen];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 overflow-x-hidden overflow-y-auto no-scrollbar app-scroll"
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </div>

      <Fab />
      <BottomNav />
      <ChatSheet />
      <AnimatePresence>
        {bookingOpen && <BookingSheet />}
      </AnimatePresence>
      <AnimatePresence>
        {voiceOpen && <VoiceSheet />}
      </AnimatePresence>
    </div>
  );
}
