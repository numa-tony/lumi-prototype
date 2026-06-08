// Centered section header rendered in the WA linear stream when a new topic starts.
export function WaTopicSection({ emoji, topic }: { emoji: string; topic: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="rounded-full bg-[#e1f3fb] px-4 py-1.5 text-[12px] font-medium text-[#4a7fa3]">
        {emoji} {topic}
      </div>
    </div>
  );
}
