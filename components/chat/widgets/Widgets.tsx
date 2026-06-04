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

export function ReservationCard({ data }: { data: ReservationCardData }) {
  return (
    <div className={card}>
      {data.image && <img src={data.image} alt="" className="h-36 w-full object-cover" />}
      <div className="p-4">
        <p className="text-[16px] font-semibold text-ink">{data.property}</p>
        <p className="text-[13px] text-ink-soft">{data.location}</p>
        <div className="mt-3 flex rounded-2xl bg-surface-muted">
          <div className="flex-1 px-4 py-3">
            <p className="text-[11px] text-ink-faint">Check-in</p>
            <p className="text-[14px] font-semibold text-ink">{data.checkIn}</p>
          </div>
          <div className="my-2 w-px bg-line" />
          <div className="flex-1 px-4 py-3">
            <p className="text-[11px] text-ink-faint">Check-out</p>
            <p className="text-[14px] font-semibold text-ink">{data.checkOut}</p>
          </div>
        </div>
        {(data.room || data.status) && (
          <div className="mt-3 flex items-center justify-between text-[13px]">
            {data.room && <span className="text-ink-soft">Room {data.room}{data.doorCode ? ` · Code ${data.doorCode}` : ""}</span>}
            {data.status && <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[12px] font-semibold text-go">{data.status}</span>}
          </div>
        )}
        {data.action && (
          <button className="mt-3 w-full rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-surface active:opacity-80">
            {data.action}
          </button>
        )}
      </div>
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
    <div className="space-y-2">
      {data.prompt && <p className="text-[14px] text-ink">{data.prompt}</p>}
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onRespond?.(o)}
            className={`rounded-2xl border px-4 py-3 text-left text-[14px] font-semibold active:scale-[0.99] ${
              o === "Something else" ? "border-line text-ink-soft" : "border-ink/15 text-ink"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MapWidget({ data }: { data: MapWidgetData }) {
  return (
    <div className={card}>
      {/* faked map surface */}
      <div className="relative h-40 w-full overflow-hidden bg-[#e8efe6]">
        <div className="absolute inset-0 opacity-70" style={{
          backgroundImage:
            "linear-gradient(#dfe8db 1px,transparent 1px),linear-gradient(90deg,#dfe8db 1px,transparent 1px)",
          backgroundSize: "26px 26px",
        }} />
        <div className="absolute left-[18%] top-[40%] h-2.5 w-[55%] -rotate-12 rounded bg-[#cfe0c8]" />
        <div className="absolute left-[30%] top-[62%] h-2 w-[60%] rotate-6 rounded bg-[#cfe0c8]" />
        {data.pois.slice(0, 4).map((p, i) => (
          <span
            key={i}
            className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-numa text-[11px] font-semibold text-surface shadow"
            style={{ left: `${18 + i * 20}%`, top: `${30 + (i % 2) * 28}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto p-3 no-scrollbar">
        {data.pois.map((p, i) => (
          <div key={i} className="w-44 shrink-0 overflow-hidden rounded-2xl border border-line">
            {p.image && <img src={p.image} alt="" className="h-20 w-full object-cover" />}
            <div className="p-2.5">
              <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
              <p className="text-[11px] text-ink-soft">
                {p.rating ? `★ ${p.rating} · ` : ""}{p.type}
              </p>
              {p.walk && <p className="text-[11px] text-ink-faint">{p.walk}</p>}
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
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
        {data.items.map((p, i) => (
          <div key={i} className="w-56 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface">
            <img src={p.image} alt="" className="h-28 w-full object-cover" />
            <div className="p-3">
              <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
              <p className="truncate text-[12px] text-ink-soft">{p.location}</p>
              {p.priceFrom && <p className="mt-1 text-[13px] font-semibold text-ink">{p.priceFrom}</p>}
              <button className="mt-2 w-full rounded-full bg-ink py-2 text-[12px] font-semibold text-surface">View</button>
            </div>
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
