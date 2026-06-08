import type { UIMessage } from "ai";

// Widget tool parts degrade to text labels in WA — same content, channel-appropriate rendering.
const WIDGET_LABELS: Record<string, string> = {
  statusWidget: "📋 Status update",
  quickReply: "💬 Reply options",
  reservationCard: "🏠 Reservation details",
  mapWidget: "📍 Location & map",
  listWidget: "📝 List",
  propertyCarousel: "🏠 Properties",
  roomCard: "🛏 Room details",
  locationPin: "📍 Location",
  videoCard: "🎬 Video",
  imageCard: "🖼 Image",
};

function getDisplayText(message: UIMessage): string {
  const texts: string[] = [];
  for (const part of message.parts) {
    if (part.type === "text" && part.text) {
      texts.push(part.text);
    } else if (part.type?.startsWith("tool-")) {
      const widgetType = part.type.replace("tool-", "");
      if (widgetType === "setThreadTopic") continue;
      const label = WIDGET_LABELS[widgetType];
      if (label) texts.push(label);
    }
  }
  return texts.join("\n") || "";
}

export function WaBubble({ message }: { message: UIMessage }) {
  const isGuest = message.role === "user";
  const isOutbound = (message as any).metadata?.origin === "outbound";
  const text = getDisplayText(message);
  if (!text) return null;

  const time = (message as any).metadata?.time ?? "9:41";

  if (isOutbound) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="rounded-full bg-[#e1f3fb] px-3 py-1 text-[11px] text-[#4a7fa3]">
          Lumi sent a message
        </div>
        <div className="ml-3 max-w-[78%] self-start">
          <div className="relative rounded-[8px] rounded-tl-none bg-white px-3 py-2 shadow-sm">
            {/* tail */}
            <div className="absolute -left-[6px] top-0 h-0 w-0 border-b-[8px] border-r-[7px] border-t-0 border-b-transparent border-r-white" />
            <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111]">{text}</p>
            <p className="mt-1 text-right text-[11px] text-[#8a8a8a]">{time}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="flex justify-end px-3 py-0.5">
        <div className="relative max-w-[78%] rounded-[8px] rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
          {/* tail */}
          <div className="absolute -right-[6px] top-0 h-0 w-0 border-b-[8px] border-l-[7px] border-t-0 border-b-transparent border-l-[#dcf8c6]" />
          <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111]">{text}</p>
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-[11px] text-[#8a8a8a]">{time}</span>
            {/* double-tick */}
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden>
              <path d="M1 5l3 3 5-7" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 5l3 3 5-7" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Lumi (assistant) bubble — left-aligned white
  return (
    <div className="flex px-3 py-0.5">
      <div className="relative max-w-[78%] rounded-[8px] rounded-tl-none bg-white px-3 py-2 shadow-sm">
        {/* tail */}
        <div className="absolute -left-[6px] top-0 h-0 w-0 border-b-[8px] border-r-[7px] border-t-0 border-b-transparent border-r-white" />
        <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111]">{text}</p>
        <p className="mt-1 text-right text-[11px] text-[#8a8a8a]">{time}</p>
      </div>
    </div>
  );
}
