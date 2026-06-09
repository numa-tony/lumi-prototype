import type { UIMessage } from "ai";

const APP_URL = "https://numa-lumi-prototype.vercel.app";

// Widget parts degrade to a "View in Lumi app" deep-link in WA.
const WIDGET_LABELS: Record<string, string> = {
  statusWidget: "📋 Request status",
  quickReply: "💬 Reply options",
  reservationCard: "🏠 Reservation details",
  mapWidget: "📍 Nearby places",
  listWidget: "📝 Details",
  propertyCarousel: "🏠 Properties",
  roomCard: "🛏 Room details",
  locationPin: "📍 Location",
  videoCard: "🎬 Video",
  imageCard: "🖼 Photos",
};

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text" && (p as any).text)
    .map((p) => (p as any).text as string)
    .join("\n");
}

function getWidgetLinks(message: UIMessage): string[] {
  const links: string[] = [];
  for (const part of message.parts) {
    if (!part.type?.startsWith("tool-")) continue;
    const widgetType = part.type.replace("tool-", "");
    if (widgetType === "setThreadTopic") continue;
    const label = WIDGET_LABELS[widgetType];
    if (label) links.push(label);
  }
  return links;
}

export function WaBubble({ message }: { message: UIMessage }) {
  const isGuest = message.role === "user";
  const isOutbound = (message as any).metadata?.origin === "outbound";
  const text = getTextContent(message);
  const widgetLinks = getWidgetLinks(message);
  if (!text && widgetLinks.length === 0) return null;

  const time = (message as any).metadata?.time ?? "9:41";

  if (isOutbound) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="rounded-full bg-[#e1f3fb] px-3 py-1 text-[11px] text-[#4a7fa3]">
          Lumi sent a message
        </div>
        <div className="ml-3 max-w-[78%] self-start">
          <div className="relative rounded-[8px] rounded-tl-none bg-white px-3 py-2 shadow-sm">
            <div className="absolute -left-[6px] top-0 h-0 w-0 border-b-[8px] border-r-[7px] border-t-0 border-b-transparent border-r-white" />
            {text && <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111]">{text}</p>}
            <WidgetLinks links={widgetLinks} />
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
          <div className="absolute -right-[6px] top-0 h-0 w-0 border-b-[8px] border-l-[7px] border-t-0 border-b-transparent border-l-[#dcf8c6]" />
          {text && <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111]">{text}</p>}
          <WidgetLinks links={widgetLinks} />
          <div className="mt-1 flex items-center justify-end gap-1">
            <span className="text-[11px] text-[#8a8a8a]">{time}</span>
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
        <div className="absolute -left-[6px] top-0 h-0 w-0 border-b-[8px] border-r-[7px] border-t-0 border-b-transparent border-r-white" />
        {text && <p className="whitespace-pre-line text-[14px] leading-[1.4] text-[#111]">{text}</p>}
        <WidgetLinks links={widgetLinks} />
        <p className="mt-1 text-right text-[11px] text-[#8a8a8a]">{time}</p>
      </div>
    </div>
  );
}

function WidgetLinks({ links }: { links: string[] }) {
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {links.map((label) => (
        <a
          key={label}
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-[#e0e0e0] bg-white/60 px-2.5 py-1.5 text-[13px] text-[#0b6ea8] no-underline active:opacity-70"
        >
          <span>{label}</span>
          <span className="ml-auto text-[10px] text-[#8a8a8a]">Open in Lumi ↗</span>
        </a>
      ))}
    </div>
  );
}
