// Lumi's iridescent orb mark (stand-in for the brand "knot" until Figma).
export function LumiOrb({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="inline-block shrink-0 rounded-full"
    >
      <span
        className="block h-full w-full rounded-full"
        style={{
          background:
            "conic-gradient(from 140deg, #ff8a3d, #ff4f5e, #a14cff, #4c9bff, #34d6c3, #ffd84c, #ff8a3d)",
          filter: "saturate(1.15)",
          boxShadow: "inset 0 0 6px rgba(255,255,255,0.55)",
        }}
      />
    </span>
  );
}
