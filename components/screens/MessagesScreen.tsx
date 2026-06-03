"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { useApp } from "@/lib/store";
import type { PersistedThread, ThreadFilter } from "@/lib/types";

const IMG_LUMI = "https://www.figma.com/api/mcp/asset/c5fa1451-f3c3-4672-bad0-97cc1122794d";

const CHIPS: { id: "all" | ThreadFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "priority", label: "Priority" },
  { id: "support", label: "Support" },
  { id: "updates", label: "Updates" },
];

const WIDGET_LABELS: Record<string, string> = {
  reservationCard: "Reservation",
  statusWidget: "Status update",
  listWidget: "List",
  quickReply: "Quick reply",
  mapWidget: "Nearby places",
  locationPin: "Location",
  propertyCarousel: "Property suggestions",
  roomCard: "Room",
  videoCard: "Video",
  imageCard: "Photos",
};

function previewFromMessages(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    for (let j = m.parts.length - 1; j >= 0; j--) {
      const p = m.parts[j];
      if (p.type === "text" && p.text) return p.text;
      if (p.type.startsWith("tool-")) {
        const widgetName = p.type.slice("tool-".length);
        return WIDGET_LABELS[widgetName] ?? "Widget";
      }
    }
  }
  return "";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - d.getTime()) / dayMs);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ThreadRow({ thread }: { thread: PersistedThread }) {
  const openChat = useApp((s) => s.openChat);
  const preview = thread.preview ?? previewFromMessages(thread.messages);
  const time = thread.time ?? formatTime(thread.updatedAt);
  return (
    <button
      onClick={() =>
        openChat({
          kind: "thread",
          title: "Lumi",
          threadId: thread.id,
          hint: thread.hint,
        })
      }
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left active:bg-surface-muted"
    >
      <div className="relative">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-numa-soft text-[22px]">
          {thread.emoji}
        </span>
        {thread.unread && (
          <span className="absolute -left-0.5 top-1 h-2.5 w-2.5 rounded-full bg-numa ring-2 ring-surface" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-ink">{thread.topic}</p>
          {thread.active && (
            <span className="rounded-full bg-numa-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-numa">
              Active
            </span>
          )}
          {thread.state === "resolved" && (
            <span className="text-[11px] font-medium text-go">Resolved</span>
          )}
        </div>
        {preview && (
          <p className="truncate text-[13px] text-ink-soft">{preview}</p>
        )}
      </div>
      <span className="shrink-0 self-start pt-0.5 text-[12px] text-ink-faint">
        {time}
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-8 pt-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG_LUMI} alt="" className="w-32 opacity-90" />
      <p className="mt-4 text-[16px] font-semibold text-ink">
        Your conversations will appear here
      </p>
      <p className="mt-1.5 text-[14px] font-light text-ink-soft">
        Tap the Ask AI button anywhere to start chatting with Lumi.
      </p>
    </div>
  );
}

export function MessagesScreen() {
  const threads = useApp((s) => s.threads);
  const [chip, setChip] = useState<"all" | ThreadFilter>("all");

  const visible = threads.filter((t) => chip === "all" || t.filter === chip);
  const pinned = visible.filter((t) => t.active);
  const rest = visible
    .filter((t) => !t.active)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const isEmpty = threads.length === 0;

  return (
    <div className="pb-28">
      <div className="px-5 pt-14">
        <h1 className="text-[30px] font-semibold tracking-tight text-ink">Messages</h1>
        {!isEmpty && (
          <div className="mt-4 flex gap-2">
            {CHIPS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChip(c.id)}
                className={`flex h-9 shrink-0 items-center rounded-full px-3 text-[16px] font-semibold leading-5 tracking-[-0.2px] ${
                  chip === c.id ? "bg-[#191919] text-white" : "border-2 border-[#eceae7] text-[#191919]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="mt-3 divide-y divide-line">
          {pinned.map((t) => (
            <ThreadRow key={t.id} thread={t} />
          ))}
          {pinned.length > 0 && rest.length > 0 && (
            <p className="px-5 pb-1 pt-4 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              Recent
            </p>
          )}
          {rest.map((t) => (
            <ThreadRow key={t.id} thread={t} />
          ))}
        </div>
      )}
    </div>
  );
}
