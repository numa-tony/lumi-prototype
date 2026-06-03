"use client";

import type { WidgetType } from "@/lib/types";
import {
  ReservationCard,
  StatusWidget,
  ListWidget,
  QuickReply,
  MapWidget,
  LocationPin,
  PropertyCarousel,
  RoomCard,
  VideoCard,
  ImageCard,
} from "./Widgets";

// Single dispatch point used by both seeded threads and live tool-call parts.
// `data` is the widget's payload (the tool output, or the seed's widget.data).
export function Widget({
  type,
  data,
  onRespond,
}: {
  type: WidgetType;
  data: unknown;
  onRespond?: (text: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  switch (type) {
    case "reservationCard":
      return <ReservationCard data={d} />;
    case "statusWidget":
      return <StatusWidget data={d} />;
    case "listWidget":
      return <ListWidget data={d} />;
    case "quickReply":
      return <QuickReply data={d} onRespond={onRespond} />;
    case "mapWidget":
      return <MapWidget data={d} />;
    case "locationPin":
      return <LocationPin data={d} />;
    case "propertyCarousel":
      return <PropertyCarousel data={d} />;
    case "roomCard":
      return <RoomCard data={d} />;
    case "videoCard":
      return <VideoCard data={d} />;
    case "imageCard":
      return <ImageCard data={d} />;
    default:
      return null;
  }
}

// Map a live AI SDK tool part type ("tool-statusWidget") to a WidgetType.
export function toolPartToWidgetType(partType: string): WidgetType | null {
  if (!partType.startsWith("tool-")) return null;
  return partType.slice("tool-".length) as WidgetType;
}
