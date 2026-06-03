import { IMG } from "./properties";
import type { ReservationCardData } from "../types";

// The mock guest persona that grounds Lumi. Editing this one object changes
// who Lumi thinks she's talking to across the whole demo.
export const GUEST = {
  firstName: "Sarah",
  fullName: "Sarah Klein",
  // Current in-stay context.
  stay: {
    property: "Numa Berlin Novela",
    city: "Berlin",
    location: "Großbeerenstraße, Kreuzberg",
    room: "204",
    checkIn: "Mon, Jun 1 · 3:00 PM",
    checkOut: "Wed, Jun 3 · 11:00 AM",
    doorCode: "2930",
    reservationId: "FJKD3K",
    image: IMG.roomBerlin,
  },
};

export const CURRENT_RESERVATION: ReservationCardData = {
  property: GUEST.stay.property,
  location: GUEST.stay.location,
  image: GUEST.stay.image,
  checkIn: GUEST.stay.checkIn,
  checkOut: GUEST.stay.checkOut,
  room: GUEST.stay.room,
  doorCode: GUEST.stay.doorCode,
  status: "Checked in",
};

// A short, upcoming trip used on Explore / My Trips (matches the Figma screen).
// `image` is the YAYS Amsterdam room from the Figma trip-card export — single
// source of truth so Explore and My Trips can't drift.
export const UPCOMING_TRIP = {
  property: "YAYS Amsterdam North by Numa",
  dates: "Apr 14 – 15, 2026",
  reservationId: "FJKD3K",
  image:
    "https://www.figma.com/api/mcp/asset/7be2e8e0-2877-431f-b26f-854b33414bd7",
  needsCheckIn: true,
};
