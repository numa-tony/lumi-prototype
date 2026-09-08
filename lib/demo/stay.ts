"use client";

// Per-story stay data.
//
// Explore / My Trips / Trip Detail / Your room read the guest's stay through
// this hook. While the All-Hands story is running they see that story's stay
// (Berlin Friedrichshain, July, room 204) instead of the app's default; every
// other context — including Sarah's Day — sees exactly what it always saw.

import { useApp } from "@/lib/store";
import { UPCOMING_TRIP, GUEST } from "@/lib/mock/guest";
import { ALLHANDS_STAY } from "./allHands";

export interface StoryStay {
  property: string;
  city: string;
  location: string;
  room: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  dates: string;
  doorCode: string;
  reservationId: string;
  image: string;
  // Trip cards on Explore / My Trips hide entirely when this is false — she's
  // on the train home with nothing booked.
  visible: boolean;
  needsCheckIn: boolean;
}

const DEFAULT_STAY: StoryStay = {
  property: UPCOMING_TRIP.property,
  city: GUEST.stay.city,
  location: GUEST.stay.location,
  room: GUEST.stay.room,
  roomType: "Medium Studio with Kitchenette",
  checkIn: GUEST.stay.checkIn,
  checkOut: GUEST.stay.checkOut,
  checkInDate: GUEST.stay.checkIn,
  checkInTime: "",
  checkOutDate: GUEST.stay.checkOut,
  checkOutTime: "",
  dates: UPCOMING_TRIP.dates,
  doorCode: GUEST.stay.doorCode,
  reservationId: UPCOMING_TRIP.reservationId,
  image: UPCOMING_TRIP.image,
  visible: true,
  needsCheckIn: UPCOMING_TRIP.needsCheckIn,
};

export function useStay(): StoryStay {
  const active = useApp((s) => s.demo.active);
  const storyId = useApp((s) => s.demo.storyId);
  const visible = useApp((s) => s.demo.stayVisible);

  if (!active || storyId !== "allhands") return DEFAULT_STAY;

  return {
    ...ALLHANDS_STAY,
    visible,
    // Her stay is in progress, not something to check into.
    needsCheckIn: false,
  };
}
