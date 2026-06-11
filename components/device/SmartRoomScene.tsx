"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";

// Warmth → ambient glow color
const WARMTH_COLOR: Record<string, string> = {
  warm: "#ffb46b",
  neutral: "#fff3d9",
  cool: "#cfe0ff",
};

// Eiffel Tower as a minimal inline SVG path
function EiffelTower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* base legs */}
      <path d="M0 80 L10 48 L18 48 L20 0 L22 48 L30 48 L40 80 Z" fill="rgba(15,22,38,0.85)" />
      {/* first platform */}
      <rect x="9" y="46" width="22" height="4" fill="rgba(15,22,38,0.9)" rx="1" />
      {/* second platform */}
      <rect x="16" y="26" width="8" height="2.5" fill="rgba(15,22,38,0.9)" rx="1" />
      {/* spire glow */}
      <circle cx="20" cy="2" r="2" fill="rgba(255,200,120,0.7)" />
    </svg>
  );
}

// Padlock SVG with animated shackle
function Padlock({ state, className }: { state: "locked" | "unlocked" | "open"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="4" y="11" width="16" height="11" rx="2" fill="#2a1a10" stroke="#5a3a28" strokeWidth="1.5" />
      <circle cx="12" cy="16.5" r="1.5" fill={state === "locked" ? "#cc4444" : "#44cc88"} />
      {/* shackle */}
      <motion.path
        d="M8 11 V7 a4 4 0 0 1 8 0 V11"
        stroke="#5a3a28"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={state === "unlocked" || state === "open"
          ? { rotate: -45, originX: "8px", originY: "11px", translateY: -4, translateX: 4 }
          : { rotate: 0, translateY: 0, translateX: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </svg>
  );
}

export function SmartRoomScene() {
  const inStay = useApp((s) => s.inStay);
  const smartRoom = useApp((s) => s.smartRoom);
  const roomBreakout = useApp((s) => s.demo.roomBreakout);
  const { lights, tv, blinds, door, ac, windowSky } = smartRoom;

  const warmthColor = WARMTH_COLOR[lights.warmth] ?? WARMTH_COLOR.warm;
  const lightOverlayOpacity = lights.on ? 0.12 + 0.42 * (lights.brightness / 100) : 0;
  const blindsOpen = blinds.position / 100;
  const curtainScale = 1 - blindsOpen;
  const doorIsOpen = door.state === "open";

  // Story Mode drives visibility explicitly via `roomBreakout` so the scene can
  // stay mounted (dark) when the climax turns the lights off. Live mode has no
  // breakout, so it still shows only when in-stay AND lights are on.
  const sceneVisible = roomBreakout || (inStay && lights.on);

  return (
    <AnimatePresence>
      {sceneVisible && (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >

      {/* ── L0: Base wall ──────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(120% 80% at 50% 25%, #3a1418 0%, #2a0d10 55%, #1a0709 100%),
            linear-gradient(to bottom, transparent 78%, #1a0d09 100%)
          `,
        }}
      />

      {/* Wood floor strip at the bottom */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "20vh",
          background: `
            linear-gradient(to bottom, #2a1810 0%, #1a0e08 60%, #110a05 100%)
          `,
          borderTop: "1px solid rgba(90,50,30,0.3)",
        }}
      />
      {/* Subtle wood grain lines */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "20vh",
          backgroundImage: `repeating-linear-gradient(
            92deg,
            transparent 0px,
            transparent 18px,
            rgba(0,0,0,0.08) 18px,
            rgba(0,0,0,0.08) 19px
          )`,
          opacity: 0.6,
        }}
      />

      {/* ── L6: Door (far left) ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-[1vw]"
        style={{ width: "10vw", height: "55vh", perspective: "1200px" }}
      >
        {/* Door frame surround */}
        <div
          className="absolute inset-0 rounded-t-[8px]"
          style={{ border: "3px solid #3d2318", background: "transparent" }}
        />
        {/* Door panel */}
        <motion.div
          className="absolute inset-[3px] rounded-t-[6px]"
          style={{
            transformOrigin: "left center",
            background: "linear-gradient(135deg, #3d2010 0%, #2a1509 50%, #1e0f06 100%)",
            borderRight: "2px solid #5a3020",
          }}
          animate={{ rotateY: doorIsOpen ? -72 : 0 }}
          transition={{ type: "spring", stiffness: 70, damping: 14 }}
        >
          {/* Door panels / detail */}
          <div className="absolute inset-x-3 top-4 h-[28%] rounded-sm border border-[#5a3020]/40" />
          <div className="absolute inset-x-3 bottom-16 top-[38%] rounded-sm border border-[#5a3020]/40" />
          {/* Handle */}
          <div
            className="absolute right-3 top-1/2 h-8 w-2 -translate-y-1/2 rounded-full"
            style={{ background: "linear-gradient(to right, #8a6040, #c0904a, #8a6040)" }}
          />
        </motion.div>

        {/* Hallway light spill when door open */}
        <AnimatePresence>
          {doorIsOpen && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: "radial-gradient(ellipse at 0% 50%, rgba(255,200,120,0.25) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>

        {/* Padlock + status dot */}
        <div className="absolute -right-8 top-[30%] flex flex-col items-center gap-1">
          <Padlock state={door.state} className="h-6 w-6" />
          <motion.div
            className="h-2 w-2 rounded-full"
            animate={{ backgroundColor: door.state === "locked" ? "#cc4444" : "#44cc88" }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* ── L7: Thermostat (wall between door and window) ─────────────────── */}
      <div className="absolute left-[13vw] top-[42vh]">
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: "#1e0f0a",
            border: `3px solid ${ac.mode === "cool" ? "#44aacc" : ac.mode === "heat" ? "#cc8844" : "#3a2018"}`,
            boxShadow: ac.mode !== "off" ? `0 0 12px ${ac.mode === "cool" ? "rgba(68,170,204,0.3)" : "rgba(204,136,68,0.3)"}` : "none",
            transition: "border-color 0.5s, box-shadow 0.5s",
          }}
        >
          <motion.span
            key={ac.setpoint}
            className="text-[11px] font-semibold"
            style={{ color: ac.mode === "cool" ? "#7acce8" : ac.mode === "heat" ? "#e8a870" : "#6a4a38" }}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {ac.setpoint}°
          </motion.span>
        </div>
        {/* AC mode shimmer streaks */}
        <AnimatePresence>
          {ac.mode !== "off" && (
            <motion.div
              className="absolute left-1/2 top-full -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`ac-shimmer-streak absolute h-6 w-px ${ac.mode === "cool" ? "bg-cyan-400/30" : "bg-orange-400/30"}`}
                  style={{ left: `${(i - 1) * 8}px`, animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── L1: French window + Paris cityscape + curtains ────────────────── */}
      <div
        className="absolute overflow-hidden rounded-t-[12px]"
        style={{
          left: "6vw",
          top: "12vh",
          width: "26vw",
          height: "64vh",
          border: "6px solid #2a1810",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5), 4px 0 16px rgba(0,0,0,0.4)",
        }}
      >
        {/* Window frame vertical + horizontal muntin bars */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-x-0 top-1/3 h-[5px] bg-[#2a1810]" />
          <div className="absolute inset-x-0 top-[60%] h-[4px] bg-[#2a1810]" />
          <div className="absolute inset-y-0 left-1/2 w-[5px] -translate-x-1/2 bg-[#2a1810]" />
        </div>

        {/* Paris cityscape behind the glass */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: blindsOpen > 0.1 ? blindsOpen : 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Sky gradient — transitions between morning and evening */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: windowSky === "morning"
                ? "linear-gradient(to bottom, #a8d4f5 0%, #c8e8f8 25%, #e8d4b0 55%, #f0c88a 75%, #d4906a 90%, #b87850 100%)"
                : "linear-gradient(to bottom, #0d1520 0%, #1a2740 30%, #2a3e60 55%, #4a5870 75%, #6a6050 88%, #887060 100%)",
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* Morning: sun glow low on horizon */}
          <motion.div
            className="absolute"
            style={{
              left: "20%",
              bottom: "38%",
              width: "60%",
              height: "30%",
              background: "radial-gradient(ellipse at 50% 100%, rgba(255,220,120,0.55) 0%, rgba(255,180,60,0.2) 50%, transparent 80%)",
              filter: "blur(6px)",
            }}
            animate={{ opacity: windowSky === "morning" ? 1 : 0 }}
            transition={{ duration: 1.0 }}
          />

          {/* Sun (morning) */}
          <motion.div
            className="absolute rounded-full"
            style={{
              right: "22%",
              top: "28%",
              width: "14px",
              height: "14px",
              background: "radial-gradient(circle at 40% 40%, #fff8d0, #ffd060)",
              boxShadow: "0 0 14px rgba(255,220,80,0.7), 0 0 40px rgba(255,200,60,0.3)",
            }}
            animate={{ opacity: windowSky === "morning" ? 1 : 0 }}
            transition={{ duration: 1.0 }}
          />

          {/* Moon (evening) */}
          <motion.div
            className="absolute right-[15%] top-[12%] h-5 w-5 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, #fffce8, #f8e0b0)",
              boxShadow: "0 0 12px rgba(255,240,180,0.5), 0 0 30px rgba(255,240,180,0.2)",
            }}
            animate={{ opacity: windowSky === "morning" ? 0 : 1 }}
            transition={{ duration: 1.0 }}
          />

          {/* City building silhouette */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: "55%",
              background: "rgba(12,18,30,0.92)",
              clipPath: `polygon(
                0% 100%, 0% 68%, 4% 68%, 4% 52%, 9% 52%, 9% 62%,
                14% 62%, 14% 42%, 20% 42%, 20% 55%,
                25% 55%, 25% 38%, 32% 38%, 32% 52%,
                36% 52%, 36% 30%, 42% 30%, 42% 65%,
                44% 65%, 44% 28%, 46% 28%, 46% 65%,
                54% 65%, 54% 28%, 56% 28%, 56% 65%,
                58% 65%, 58% 45%, 64% 45%, 64% 55%,
                70% 55%, 70% 40%, 76% 40%, 76% 52%,
                82% 52%, 82% 60%, 88% 60%, 88% 48%,
                94% 48%, 94% 65%, 100% 65%, 100% 100%
              )`,
            }}
          />

          {/* Eiffel Tower centered */}
          <EiffelTower className="absolute bottom-[46%] left-[44%] h-[24%] w-[12%]" />

          {/* Warm city lights glow at horizon */}
          <div
            className="absolute inset-x-0"
            style={{
              bottom: "45%",
              height: "8%",
              background: "linear-gradient(to top, rgba(255,160,60,0.12), transparent)",
            }}
          />
        </motion.div>

        {/* Left curtain panel */}
        <motion.div
          className="absolute inset-y-0 left-0 z-20"
          style={{
            width: "52%",
            transformOrigin: "left center",
            background: `
              repeating-linear-gradient(
                to right,
                #5a1d22 0px, #4a1820 4px, #6a2228 8px, #5a1d22 12px
              )
            `,
            boxShadow: "inset -8px 0 16px rgba(0,0,0,0.4), 4px 0 8px rgba(0,0,0,0.3)",
          }}
          animate={{ scaleX: curtainScale }}
          transition={{ type: "spring", stiffness: 60, damping: 16, mass: 1.2 }}
        />

        {/* Right curtain panel */}
        <motion.div
          className="absolute inset-y-0 right-0 z-20"
          style={{
            width: "52%",
            transformOrigin: "right center",
            background: `
              repeating-linear-gradient(
                to right,
                #5a1d22 0px, #4a1820 4px, #6a2228 8px, #5a1d22 12px
              )
            `,
            boxShadow: "inset 8px 0 16px rgba(0,0,0,0.4), -4px 0 8px rgba(0,0,0,0.3)",
          }}
          animate={{ scaleX: curtainScale }}
          transition={{ type: "spring", stiffness: 60, damping: 16, mass: 1.2, delay: 0.05 }}
        />
      </div>

      {/* ── L2: Flowerpot pendant lamps ────────────────────────────────────── */}

      {/* Left lamp — green */}
      <div className="absolute" style={{ left: "28vw", top: 0 }}>
        {/* Cord */}
        <div className="mx-auto h-[12vh] w-px" style={{ background: "linear-gradient(to bottom, #2a1a10, #4a3020)" }} />
        {/* Lamp glow halo */}
        <motion.div
          className="absolute"
          style={{
            width: "160px",
            height: "160px",
            top: "12vh",
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${warmthColor}40 0%, ${warmthColor}10 40%, transparent 70%)`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
          animate={{
            opacity: lights.on ? 0.5 + 0.5 * (lights.brightness / 100) : 0,
            scale: lights.on ? 0.8 + 0.6 * (lights.brightness / 100) : 0.3,
          }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        {/* Dome */}
        <div
          style={{
            width: "44px",
            height: "22px",
            borderRadius: "0 0 999px 999px",
            background: lights.on
              ? "radial-gradient(ellipse at 50% 80%, #5a9050, #2d6028)"
              : "radial-gradient(ellipse at 50% 80%, #2a4028, #1a2818)",
            boxShadow: lights.on ? `0 4px 20px ${warmthColor}60` : "none",
            transition: "background 0.6s, box-shadow 0.6s",
            margin: "0 auto",
          }}
        />
      </div>

      {/* Right lamp — red/orange */}
      <div className="absolute" style={{ right: "28vw", top: 0 }}>
        {/* Cord */}
        <div className="mx-auto h-[12vh] w-px" style={{ background: "linear-gradient(to bottom, #2a1a10, #4a3020)" }} />
        {/* Lamp glow halo */}
        <motion.div
          className="absolute"
          style={{
            width: "160px",
            height: "160px",
            top: "12vh",
            right: "50%",
            transform: "translateX(50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${warmthColor}40 0%, ${warmthColor}10 40%, transparent 70%)`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
          animate={{
            opacity: lights.on ? 0.5 + 0.5 * (lights.brightness / 100) : 0,
            scale: lights.on ? 0.8 + 0.6 * (lights.brightness / 100) : 0.3,
          }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        {/* Dome */}
        <div
          style={{
            width: "44px",
            height: "22px",
            borderRadius: "0 0 999px 999px",
            background: lights.on
              ? "radial-gradient(ellipse at 50% 80%, #c85030, #8a2010)"
              : "radial-gradient(ellipse at 50% 80%, #4a2018, #2a1008)",
            boxShadow: lights.on ? `0 4px 20px ${warmthColor}60` : "none",
            transition: "background 0.6s, box-shadow 0.6s",
            margin: "0 auto",
          }}
        />
      </div>

      {/* ── L5: Wall-mounted TV (right side) ──────────────────────────────── */}
      <div
        className="absolute"
        style={{
          right: "5vw",
          top: "18vh",
          width: "22vw",
          height: "25vh",
        }}
      >
        {/* Wall mount arm */}
        <div
          className="absolute bottom-0 left-1/2 h-6 w-2 -translate-x-1/2 translate-y-full rounded-b-sm"
          style={{ background: "#2a1810" }}
        />

        {/* TV glow halo on wall */}
        <motion.div
          className="absolute -inset-6 rounded-2xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59,123,255,0.18) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
          animate={{ opacity: tv.on ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* TV panel */}
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-[6px]"
          style={{
            background: "#080810",
            border: "3px solid #1a1a2a",
            boxShadow: tv.on ? "0 0 30px rgba(59,123,255,0.35), 0 4px 20px rgba(0,0,0,0.8)" : "0 4px 20px rgba(0,0,0,0.6)",
            transition: "box-shadow 0.5s",
          }}
          animate={{ scaleY: tv.on ? 1 : 1 }}
        >
          {/* Screen content */}
          <AnimatePresence mode="wait">
            {tv.on && (
              <motion.div
                key={`${tv.app ?? tv.channel ?? "on"}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scaleY: 0.02 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Netflix */}
                {tv.app === "Netflix" && (
                  <div className="flex h-full w-full items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #141414 0%, #1a0a0a 100%)" }}>
                    <span style={{ color: "#E50914", fontSize: "clamp(16px, 2.5vw, 36px)", fontWeight: 900, letterSpacing: "-1px", fontFamily: "sans-serif" }}>N</span>
                  </div>
                )}
                {/* Spotify */}
                {tv.app === "Spotify" && (
                  <div className="flex h-full w-full items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #191414 0%, #0a1a0a 100%)" }}>
                    <span style={{ color: "#1DB954", fontSize: "clamp(10px, 1.5vw, 20px)", fontWeight: 700, fontFamily: "sans-serif" }}>♫</span>
                  </div>
                )}
                {/* YouTube */}
                {tv.app === "YouTube" && (
                  <div className="flex h-full w-full items-center justify-center"
                    style={{ background: "#0f0f0f" }}>
                    <span style={{ color: "#FF0000", fontSize: "clamp(10px, 1.5vw, 20px)", fontWeight: 900, fontFamily: "sans-serif" }}>▶</span>
                  </div>
                )}
                {/* Generic channel or app */}
                {!["Netflix", "Spotify", "YouTube"].includes(tv.app ?? "") && (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #0a0e1a 0%, #0e1830 50%, #0a1220 100%)",
                    }}
                  >
                    {/* Simulated TV content bars */}
                    <div className="absolute inset-0 overflow-hidden opacity-30">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="absolute h-[25%]"
                          style={{
                            top: `${i * 25}%`,
                            left: 0, right: 0,
                            background: `linear-gradient(to right, rgba(40,80,160,${0.3 - i * 0.05}) 0%, rgba(60,100,200,0.1) 40%, transparent 80%)`,
                          }}
                        />
                      ))}
                    </div>
                    {(tv.channel || tv.app) && (
                      <span
                        className="relative z-10 px-2 text-center"
                        style={{
                          color: "rgba(180,200,255,0.9)",
                          fontSize: "clamp(8px, 1.2vw, 16px)",
                          fontWeight: 600,
                          fontFamily: "sans-serif",
                          textShadow: "0 0 8px rgba(100,150,255,0.8)",
                        }}
                      >
                        {tv.channel ?? tv.app}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Volume bar */}
          {tv.on && (
            <div className="absolute inset-x-2 bottom-1 h-[3px] rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-white/40"
                animate={{ width: tv.muted ? "0%" : `${tv.volume}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Mute icon */}
          {tv.on && tv.muted && (
            <div className="absolute bottom-3 right-2 text-white/50" style={{ fontSize: "clamp(8px, 1vw, 12px)" }}>🔇</div>
          )}
        </motion.div>
      </div>

      {/* ── L3: Bed + pink pillows (bottom center, peeks from behind phone) ── */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-center"
        style={{ height: "22vh" }}
      >
        {/* Headboard */}
        <div
          className="relative"
          style={{
            width: "40vw",
            height: "90%",
            background: "linear-gradient(to top, #2a1508 0%, #3d2010 60%, #4a2818 100%)",
            borderRadius: "8px 8px 0 0",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.6)",
          }}
        >
          {/* White duvet visible at top of headboard */}
          <div
            className="absolute inset-x-0 top-0 -translate-y-1/2"
            style={{
              height: "40%",
              background: "linear-gradient(to bottom, #ece7e2, #ddd8d2)",
              borderRadius: "6px 6px 0 0",
              boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
            }}
          />

          {/* Left pink pillow */}
          <div
            className="absolute"
            style={{
              left: "10%",
              top: "-28%",
              width: "35%",
              height: "45%",
              background: "radial-gradient(ellipse at 40% 35%, #ffdae0, #ffc9d2 40%, #e8b0bc)",
              borderRadius: "40%",
              boxShadow: "2px 4px 10px rgba(0,0,0,0.3), inset 0 -2px 6px rgba(200,130,140,0.3)",
            }}
          />
          {/* Right pink pillow */}
          <div
            className="absolute"
            style={{
              right: "10%",
              top: "-28%",
              width: "35%",
              height: "45%",
              background: "radial-gradient(ellipse at 60% 35%, #ffdae0, #ffc9d2 40%, #e8b0bc)",
              borderRadius: "40%",
              boxShadow: "-2px 4px 10px rgba(0,0,0,0.3), inset 0 -2px 6px rgba(200,130,140,0.3)",
            }}
          />
        </div>
      </div>

      {/* ── L4: Ambient light master overlay ─────────────────────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{ mixBlendMode: "screen", pointerEvents: "none" }}
        animate={{
          opacity: lightOverlayOpacity,
          background: `radial-gradient(ellipse at 50% 0%, ${warmthColor} 0%, ${warmthColor}80 20%, transparent 65%)`,
        }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* Floor light wedge when door is open */}
      <AnimatePresence>
        {doorIsOpen && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              bottom: 0,
              left: 0,
              width: "20vw",
              height: "18vh",
              background: "linear-gradient(to bottom-right, rgba(255,200,120,0.15), transparent)",
              clipPath: "polygon(0% 0%, 40% 0%, 80% 100%, 0% 100%)",
            }}
          />
        )}
      </AnimatePresence>

    </motion.div>
      )}
    </AnimatePresence>
  );
}
