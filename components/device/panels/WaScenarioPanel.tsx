"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { useApp } from "@/lib/store";
import { SARAH_DAY, buildOutboundMessages, scenarioSeedToUIMessage } from "@/lib/mock/waScenario";

export function WaScenarioPanel() {
  const [played, setPlayed] = useState<Set<string>>(new Set());

  const setWaActiveThread = useApp((s) => s.setWaActiveThread);
  const setWaPendingText = useApp((s) => s.setWaPendingText);
  const createThread = useApp((s) => s.createThread);
  const saveThreadMessages = useApp((s) => s.saveThreadMessages);
  const renameThread = useApp((s) => s.renameThread);
  const resolveWaThread = useApp((s) => s.resolveWaThread);
  const pushLumiOutbound = useApp((s) => s.pushLumiOutbound);

  const play = (id: string) => {
    if (played.has(id)) return;
    const step = SARAH_DAY.find((s) => s.id === id);
    if (!step) return;

    if (step.kind === "guest-wa" && step.guestText) {
      // Reset active thread so this becomes a new topic
      setWaActiveThread(null);
      // Small delay so the state update is flushed before sending
      setTimeout(() => {
        setWaPendingText(step.guestText!);
      }, 50);
    }

    if (step.kind === "app-only" && step.appThread) {
      const prefix = `${id}-${nanoid(4)}`;
      const threadId = createThread(step.appThread.messages[0]?.text ?? step.appThread.topic);
      const messages = step.appThread.messages.map((s) => scenarioSeedToUIMessage(s, prefix));
      saveThreadMessages(threadId, messages);
      renameThread(threadId, step.appThread.topic, step.appThread.emoji);
    }

    if (step.kind === "ops-update" && step.topicMatch && step.waText && step.appStatusSeed) {
      const prefix = `${id}-${nanoid(4)}`;
      const appStatusMessage = scenarioSeedToUIMessage(step.appStatusSeed, prefix);
      resolveWaThread({
        topicMatch: step.topicMatch,
        waText: step.waText,
        appStatusMessage,
      });
    }

    if (step.kind === "lumi-outbound" && step.outbound) {
      const prefix = `${id}-${nanoid(4)}`;
      const appMessages = buildOutboundMessages(step.outbound.appSeeds, `app-${prefix}`);
      const waMessages = buildOutboundMessages(step.outbound.waSeeds, `wa-${prefix}`, true);
      pushLumiOutbound({
        topic: step.outbound.topic,
        emoji: step.outbound.emoji,
        filter: step.outbound.filter,
        appMessages,
        waMessages,
      });
    }

    setPlayed((prev) => new Set([...prev, id]));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#555]">
          Sarah&apos;s day
        </p>
        {played.size > 0 && (
          <button
            onClick={() => setPlayed(new Set())}
            className="text-[11px] text-[#555] underline underline-offset-2 hover:text-[#888]"
          >
            Reset
          </button>
        )}
      </div>
      <p className="text-[11px] text-[#555]">
        Step through the cross-channel story in order.
      </p>

      {SARAH_DAY.map((step, i) => {
        const isDone = played.has(step.id);
        const isLocked = i > 0 && !played.has(SARAH_DAY[i - 1].id);

        return (
          <button
            key={step.id}
            onClick={() => play(step.id)}
            disabled={isDone || isLocked}
            title={step.description}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              isDone
                ? "border-[#2a2a2a] bg-[#1a1a1a] opacity-50"
                : isLocked
                  ? "cursor-not-allowed border-[#222] bg-[#1a1a1a] opacity-30"
                  : "border-[#2a2a2a] bg-[#1e1e1e] hover:bg-[#252525] active:scale-[0.99]"
            }`}
          >
            <span className="shrink-0 text-base">
              {isDone ? "✓" : kindIcon(step.kind)}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-semibold ${isDone ? "text-[#555]" : "text-[#f0f0f0]"}`}>
                {step.label}
              </p>
              <p className="truncate text-[11px] text-[#666]">{step.description}</p>
            </div>
            <ChannelBadge kind={step.kind} />
          </button>
        );
      })}
    </div>
  );
}

function kindIcon(kind: string): string {
  switch (kind) {
    case "guest-wa": return "💬";
    case "app-only": return "📱";
    case "ops-update": return "⚙️";
    case "lumi-outbound": return "📤";
    default: return "▶";
  }
}

function ChannelBadge({ kind }: { kind: string }) {
  const config: Record<string, { label: string; color: string }> = {
    "guest-wa": { label: "WA", color: "bg-[#25d366]/20 text-[#25d366]" },
    "app-only": { label: "App", color: "bg-[#ff671f]/20 text-[#ff671f]" },
    "ops-update": { label: "Ops", color: "bg-[#888]/20 text-[#888]" },
    "lumi-outbound": { label: "Both", color: "bg-[#4a7fa3]/20 text-[#4a7fa3]" },
  };
  const { label, color } = config[kind] ?? { label: "—", color: "text-[#555]" };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {label}
    </span>
  );
}
