"use client";

import type {
  ReservationCardData,
  StatusWidgetData,
  ListWidgetData,
  QuickReplyData,
  MapWidgetData,
  LocationPinData,
  PropertyCarouselData,
  RoomCardData,
  VideoCardData,
  ImageCardData,
} from "@/lib/types";

const card = "overflow-hidden rounded-2xl border border-line bg-surface";

/* eslint-disable @next/next/no-img-element */

// A ticket, not a form: check-in and check-out either side of a rule, then a
// perforated edge and the property name along the stub (per Figma).
export function ReservationCard({ data }: { data: ReservationCardData }) {
  // Callers pass either "204" or "Room 204" — render one "Room 204" either way.
  const room = data.room?.replace(/^room\s+/i, "");
  return (
    <div className="relative overflow-hidden rounded-[16px] bg-surface shadow-[0_6px_28px_-10px_rgba(0,0,0,0.22)]">
      {data.image && <img src={data.image} alt="" className="h-32 w-full object-cover" />}
      <div className="flex px-5 pb-5 pt-5">
        <div className="flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.2px] text-ink">Check-in</p>
          <p className="mt-1.5 whitespace-pre-line text-[15px] font-light leading-[22px] text-[#6d706f] [text-wrap:nowrap]">
            {data.checkIn}
          </p>
        </div>
        <div className="mx-3 w-px shrink-0 bg-line-light" />
        <div className="flex-1 text-right">
          <p className="text-[15px] font-semibold tracking-[-0.2px] text-ink">Check-out</p>
          <p className="mt-1.5 whitespace-pre-line text-[15px] font-light leading-[22px] text-[#6d706f] [text-wrap:nowrap]">
            {data.checkOut}
          </p>
        </div>
      </div>

      {/* perforated edge */}
      <div className="relative h-px">
        <div className="absolute inset-x-5 top-0 border-t border-dashed border-line" />
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-surface-muted" />
        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-surface-muted" />
      </div>

      <div className="px-6 pb-5 pt-4 text-center">
        <p className="text-[15px] font-light text-ink">{data.property}</p>
        {(room || data.status) && (
          <p className="mt-1 text-[13px] font-light text-[#6d706f]">
            {room ? `Room ${room}` : ""}
            {room && data.doorCode ? ` · Code ${data.doorCode}` : ""}
            {room && data.status ? " · " : ""}
            {data.status ?? ""}
          </p>
        )}
      </div>

      {data.action && (
        <div className="px-5 pb-5">
          <button className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-surface active:opacity-80">
            {data.action}
          </button>
        </div>
      )}
    </div>
  );
}

const STATE_LABEL: Record<string, { label: string; tone: string }> = {
  open: { label: "Open", tone: "text-warn" },
  in_progress: { label: "In progress", tone: "text-numa" },
  awaiting_guest: { label: "Awaiting you", tone: "text-warn" },
  resolved: { label: "Resolved", tone: "text-go" },
  closed: { label: "Closed", tone: "text-ink-faint" },
};

export function StatusWidget({ data }: { data: StatusWidgetData }) {
  const meta = STATE_LABEL[data.state] ?? STATE_LABEL.open;
  const doneCount = data.stages?.filter((s) => s.done).length ?? 0;
  const pct = data.stages?.length ? (doneCount / data.stages.length) * 100 : data.state === "resolved" ? 100 : 50;
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[15px] font-semibold text-ink">{data.title}</p>
          {data.detail && <p className="text-[12px] text-ink-faint">{data.detail}</p>}
        </div>
        <span className={`flex items-center gap-1.5 text-[12px] font-semibold ${meta.tone}`}>
          <span className={`h-2 w-2 rounded-full ${data.state === "resolved" ? "bg-go" : "bg-numa"}`} />
          {meta.label}
        </span>
      </div>
      {data.eta && <p className="mt-1 text-[13px] font-medium text-ink">{data.eta}</p>}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-full rounded-full transition-all ${data.state === "resolved" ? "bg-go" : "bg-numa"}`} style={{ width: `${pct}%` }} />
      </div>
      {data.stages && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {data.stages.map((s) => (
            <span key={s.label} className={`flex items-center gap-1 text-[11px] ${s.done ? "text-ink" : "text-ink-faint"}`}>
              <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${s.done ? "bg-go text-surface" : "border border-line"}`}>
                {s.done && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </span>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListWidget({ data }: { data: ListWidgetData }) {
  return (
    <div className={card}>
      {data.title && <p className="px-4 pb-1 pt-3.5 text-[13px] font-semibold text-ink">{data.title}</p>}
      <div className="divide-y divide-line">
        {data.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            {it.image ? (
              <img src={it.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-[20px]">{it.emoji ?? "•"}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{it.title}</p>
              {it.subtitle && <p className="truncate text-[12px] text-ink-soft">{it.subtitle}</p>}
              {it.meta && <p className="text-[12px] font-medium text-ink-faint">{it.meta}</p>}
            </div>
            {it.action && (
              <span className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-surface">{it.action}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickReply({ data, onRespond }: { data: QuickReplyData; onRespond?: (t: string) => void }) {
  const options = [...data.options, "Something else"];
  return (
    <div className="space-y-2.5">
      {data.prompt && <p className="text-[16px] font-light text-ink">{data.prompt}</p>}
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onRespond?.(o)}
            className="rounded-[10px] border border-[#e3e1df] bg-surface px-4 py-4 text-left text-[16px] font-semibold tracking-[-0.2px] text-ink active:scale-[0.99]"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Star({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="m12 17.3-6.2 3.7 1.7-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.5 4.8 1.7 7L12 17.3Z" />
    </svg>
  );
}

// The difference between telling and doing: a real map, the walk drawn on it,
// and the places ready to tap — not a paragraph of directions.
export function MapWidget({ data }: { data: MapWidgetData }) {
  return (
    <div className="relative overflow-hidden rounded-[16px] bg-[#e9eee6]">
      <img src="/allhands/map-berlin.png" alt="" className="h-[300px] w-full object-cover" />

      {/* expand affordance */}
      <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" aria-hidden>
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {/* the property, and the walk to the first spot */}
      <span className="absolute right-[16%] top-[30%] flex h-11 w-11 items-center justify-center rounded-full bg-[#191919] text-[17px] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        N
      </span>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 361 300" fill="none" aria-hidden>
        <path
          d="M108 128 C 160 152, 210 140, 258 100"
          stroke="#191919"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 7"
        />
      </svg>
      {data.pois[0]?.rating && (
        <span className="absolute left-[18%] top-[36%] flex -translate-y-full items-center gap-1 rounded-lg bg-[#191919] px-2.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <Star className="text-white" />
          {data.pois[0].rating}
        </span>
      )}

      {/* place cards, overlaid on the map */}
      <div className="absolute inset-x-0 bottom-0 flex gap-3 overflow-x-auto px-3 pb-3 no-scrollbar">
        {data.pois.map((p, i) => (
          <div
            key={i}
            className="flex w-[300px] shrink-0 items-center gap-3 rounded-[14px] bg-surface p-3 shadow-[0_6px_20px_-6px_rgba(0,0,0,0.28)]"
          >
            {p.image ? (
              <img src={p.image} alt="" className="h-[68px] w-[68px] shrink-0 rounded-[10px] object-cover" />
            ) : (
              <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-[26px]">
                🍜
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-semibold tracking-[-0.2px] text-ink">{p.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-light text-[#6d706f]">
                {p.rating != null && (
                  <>
                    <Star className="text-ink" />
                    <span className="text-ink">{p.rating}</span>
                  </>
                )}
                <span>{p.type}</span>
                {p.walk && <span>· {p.walk}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LocationPin({ data }: { data: LocationPinData }) {
  return (
    <div className={`${card} flex items-center gap-3 p-3`}>
      {data.image && <img src={data.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">{data.name}</p>
        <p className="truncate text-[12px] text-ink-soft">{data.address}</p>
      </div>
      <span className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-surface">Directions</span>
    </div>
  );
}

export function PropertyCarousel({ data }: { data: PropertyCarouselData }) {
  return (
    <div>
      {data.title && <p className="mb-2 text-[13px] font-semibold text-ink">{data.title}</p>}
      <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-1 no-scrollbar">
        {data.items.map((p, i) => (
          <div key={i} className="w-[200px] shrink-0">
            <div className="relative">
              <img src={p.image} alt="" className="h-[200px] w-full rounded-[12px] object-cover" />
              <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2.2" aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            <p className="mt-3.5 text-[17px] font-semibold leading-[23px] tracking-[-0.2px] text-ink">
              {p.name}
            </p>
            <p className="mt-1 text-[15px] font-light leading-[21px] text-[#6d706f]">{p.location}</p>
            {p.priceFrom && <p className="mt-1 text-[15px] font-semibold text-ink">{p.priceFrom}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoomCard({ data }: { data: RoomCardData }) {
  return (
    <div className={card}>
      <img src={data.image} alt="" className="h-32 w-full object-cover" />
      <div className="p-4">
        <p className="text-[15px] font-semibold text-ink">{data.name}</p>
        <p className="text-[12px] text-ink-soft">{data.bed}{data.size ? ` · ${data.size}` : ""}</p>
        {data.amenities && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.amenities.map((a) => (
              <span key={a} className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] text-ink-soft">{a}</span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          {data.priceFrom && <span className="text-[14px] font-semibold text-ink">{data.priceFrom}</span>}
          <span className="rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold text-surface">Select</span>
        </div>
      </div>
    </div>
  );
}

export function VideoCard({ data }: { data: VideoCardData }) {
  return (
    <div className={card}>
      <div className="relative">
        <img src={data.poster} alt="" className="h-40 w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-numa-soft/90 backdrop-blur">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-numa" aria-hidden><path d="M6 4l14 8-14 8z" /></svg>
          </span>
        </span>
      </div>
      <div className="p-4">
        <p className="text-[15px] font-semibold text-ink">{data.title}</p>
        {data.body && <p className="mt-1 whitespace-pre-line text-[13px] text-ink-soft">{data.body}</p>}
      </div>
    </div>
  );
}

export function ImageCard({ data }: { data: ImageCardData }) {
  const imgs = data.images.slice(0, 3);
  return (
    <div className={card}>
      <div className={`grid gap-0.5 ${imgs.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {imgs.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`h-28 w-full object-cover ${imgs.length === 3 && i === 0 ? "col-span-2 h-36" : ""}`}
          />
        ))}
      </div>
      {(data.title || data.caption) && (
        <div className="p-3">
          {data.title && <p className="text-[14px] font-semibold text-ink">{data.title}</p>}
          {data.caption && <p className="text-[12px] text-ink-soft">{data.caption}</p>}
        </div>
      )}
    </div>
  );
}
