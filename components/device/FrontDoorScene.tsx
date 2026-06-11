"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";

// null  = scene not rendered (non-arrival beats)
// false = scene visible, door closed (arrival-setup)
// true  = scene visible, door open (after Lumi message)
export function FrontDoorScene() {
  const frontDoor = useApp((s) => s.demo.frontDoor);
  const demoActive = useApp((s) => s.demo.active);
  const visible = demoActive && frontDoor !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="front-door-scene"
          className="pointer-events-none fixed inset-0 z-[6] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SceneContent open={frontDoor === true} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SceneContent({ open }: { open: boolean }) {
  return (
    <div className="absolute inset-0">

      {/* ── Night sky + building backdrop ─────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              #060810 0%,
              #0a0e1a 35%,
              #141824 60%,
              #1c1610 100%
            )
          `,
        }}
      />

      {/* Stars — hidden behind rain clouds */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity * 0.4, // dim: overcast sky
          }}
        />
      ))}

      {/* ── Rain ─────────────────────────────────────────────────────────── */}
      <RainOverlay />

      {/* ── Building facade ──────────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: "20%",
          background: `
            linear-gradient(180deg,
              #1a1610 0%,
              #221c14 30%,
              #1c1610 70%,
              #141008 100%
            )
          `,
        }}
      />

      {/* Facade texture / brick-like horizontal bands */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "20%",
          bottom: 0,
          backgroundImage: `repeating-linear-gradient(
            180deg,
            transparent 0px,
            transparent 28px,
            rgba(0,0,0,0.12) 28px,
            rgba(0,0,0,0.12) 30px
          )`,
        }}
      />

      {/* ── Ground / cobblestone ─────────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "18%",
          background: `
            linear-gradient(180deg, #1a1610 0%, #100e0a 60%, #0c0a08 100%)
          `,
          borderTop: "1px solid rgba(80,60,30,0.2)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "18%",
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 41px),
            repeating-linear-gradient(0deg, transparent 0px, transparent 14px, rgba(0,0,0,0.08) 14px, rgba(0,0,0,0.08) 15px)
          `,
        }}
      />

      {/* Wet-ground puddle sheen */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "10%",
          background: "linear-gradient(180deg, transparent 0%, rgba(100,140,200,0.08) 50%, rgba(100,140,200,0.04) 100%)",
        }}
      />

      {/* ── Front door assembly — right of phone ────────────────────────── */}
      <div
        className="absolute"
        style={{
          right: "5%",
          bottom: "18%",
          width: "clamp(200px, 22vw, 320px)",
        }}
      >
        {/* Door surround / stone arch */}
        <div
          className="relative"
          style={{
            paddingTop: "5%",
            paddingLeft: "8%",
            paddingRight: "8%",
          }}
        >
          {/* Arch lintel */}
          <div
            className="absolute inset-x-0 top-0 rounded-t-full"
            style={{
              height: "12%",
              background: "linear-gradient(180deg, #2a2010 0%, #1e1808 100%)",
              border: "2px solid rgba(80,60,30,0.4)",
            }}
          />

          {/* Door frame */}
          <div
            style={{
              position: "relative",
              paddingBottom: "200%",
              background: "linear-gradient(135deg, #2a2010 0%, #1a1408 100%)",
              border: "3px solid rgba(90,68,40,0.6)",
              borderRadius: "2px",
              overflow: "visible",
              perspective: "1200px",
            }}
          >
            {/* Warm light from inside — visible when door opens */}
            <AnimatePresence>
              {open && (
                <motion.div
                  className="absolute inset-0 rounded-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  style={{
                    background: "radial-gradient(ellipse at 40% 50%, rgba(255,200,100,0.9) 0%, rgba(255,160,60,0.6) 40%, rgba(200,100,20,0.2) 80%, transparent 100%)",
                    zIndex: 1,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Spill of warm light onto ground */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    position: "absolute",
                    bottom: "-60%",
                    left: "10%",
                    right: "10%",
                    height: "60%",
                    transformOrigin: "top center",
                    background: "radial-gradient(ellipse at 50% 0%, rgba(255,180,60,0.4) 0%, rgba(255,160,40,0.15) 50%, transparent 90%)",
                    filter: "blur(8px)",
                    zIndex: 0,
                  }}
                />
              )}
            </AnimatePresence>

            {/* The door itself — swings open */}
            <motion.div
              className="absolute inset-[3px]"
              style={{
                transformOrigin: "left center",
                background: "linear-gradient(135deg, #4a3420 0%, #3a2818 50%, #2e1e10 100%)",
                borderRight: "2px solid rgba(100,72,40,0.5)",
                borderRadius: "1px",
                zIndex: 2,
              }}
              animate={{ rotateY: open ? -78 : 0 }}
              transition={{ type: "spring", stiffness: 60, damping: 14 }}
            >
              {/* Door glass panel (upper) */}
              <div
                className="absolute"
                style={{
                  top: "8%",
                  left: "10%",
                  right: "10%",
                  height: "35%",
                  background: open
                    ? "linear-gradient(160deg, rgba(255,200,100,0.7) 0%, rgba(255,160,60,0.5) 100%)"
                    : "linear-gradient(160deg, rgba(40,50,70,0.8) 0%, rgba(20,30,50,0.9) 100%)",
                  border: "1px solid rgba(100,80,40,0.3)",
                  borderRadius: "1px",
                  transition: "background 0.4s",
                }}
              />
              {/* Door panel detail (lower) */}
              <div
                className="absolute"
                style={{
                  top: "50%",
                  left: "10%",
                  right: "10%",
                  height: "20%",
                  border: "1px solid rgba(100,80,40,0.3)",
                  borderRadius: "1px",
                }}
              />
              <div
                className="absolute"
                style={{
                  top: "74%",
                  left: "10%",
                  right: "10%",
                  height: "18%",
                  border: "1px solid rgba(100,80,40,0.3)",
                  borderRadius: "1px",
                }}
              />
              {/* Handle */}
              <div
                style={{
                  position: "absolute",
                  right: "12%",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "6%",
                  height: "14%",
                  borderRadius: "999px",
                  background: "linear-gradient(to right, #8a7050, #d4aa70, #8a7050)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                }}
              />
            </motion.div>

            {/* PIN pad — to the right of door */}
            <div
              style={{
                position: "absolute",
                right: "-18%",
                top: "20%",
                width: "12%",
                background: "rgba(20,16,10,0.9)",
                border: "1px solid rgba(80,60,30,0.4)",
                borderRadius: "3px",
                padding: "6px 4px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                zIndex: 5,
              }}
            >
              {/* Status LED */}
              <motion.div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  margin: "0 auto 2px",
                }}
                animate={{ backgroundColor: open ? "#44cc88" : "#cc4444" }}
                transition={{ duration: 0.3 }}
              />
              {/* Keypad dots */}
              {[0, 1, 2, 3].map((row) => (
                <div key={row} style={{ display: "flex", justifyContent: "space-around" }}>
                  {[0, 1, 2].map((col) => (
                    <div
                      key={col}
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "1px",
                        background: "rgba(160,140,100,0.5)",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Numa sign above door */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: "-8%",
              whiteSpace: "nowrap",
              fontSize: "clamp(8px, 1vw, 13px)",
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "rgba(220,190,120,0.8)",
              textShadow: open ? "0 0 8px rgba(255,200,80,0.6)" : "none",
              transition: "text-shadow 0.4s",
            }}
          >
            NUMA
          </div>
        </div>
      </div>

      {/* ── Ambient street glow at base ───────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "30%",
          background: "radial-gradient(ellipse at 50% 100%, rgba(255,160,40,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── Rain overlay ─────────────────────────────────────────────────────────────
// Deterministic pseudo-random drops — avoids SSR/hydration issues.
// Driven by framer-motion (CSS @keyframes wouldn't advance inside this scene
// layer) so the fall is guaranteed to play, like the door swing.
const RAINDROPS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  height: 24 + (i * 7) % 26,             // 24–50px per drop
  duration: 0.55 + (i * 0.031) % 0.35,   // 0.55–0.90s fall time
  delay: (i * 0.137) % 1.1,              // stagger initial start 0–1.1s
  opacity: 0.30 + (i * 0.039) % 0.30,    // 0.30–0.60
  width: i % 3 === 0 ? 2 : 1.5,          // mix of 1.5px and 2px
}));

function RainOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {RAINDROPS.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${drop.x}%`,
            top: 0,
            width: `${drop.width}px`,
            height: `${drop.height}px`,
            background: `rgba(180, 210, 255, ${drop.opacity})`,
            borderRadius: "1px",
            rotate: "12deg",
          }}
          initial={{ y: "-12vh" }}
          animate={{ y: "115vh" }}
          transition={{
            duration: drop.duration,
            delay: drop.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Static decorative data
const STARS = [
  { x: 8,  y: 4,  size: "1.5px", opacity: 0.6 },
  { x: 18, y: 7,  size: "1px",   opacity: 0.4 },
  { x: 28, y: 3,  size: "2px",   opacity: 0.7 },
  { x: 42, y: 6,  size: "1px",   opacity: 0.5 },
  { x: 55, y: 2,  size: "1.5px", opacity: 0.6 },
  { x: 68, y: 8,  size: "1px",   opacity: 0.4 },
  { x: 79, y: 4,  size: "2px",   opacity: 0.5 },
  { x: 88, y: 6,  size: "1px",   opacity: 0.6 },
  { x: 95, y: 3,  size: "1.5px", opacity: 0.4 },
  { x: 12, y: 12, size: "1px",   opacity: 0.3 },
  { x: 35, y: 10, size: "1.5px", opacity: 0.5 },
  { x: 72, y: 14, size: "1px",   opacity: 0.4 },
];
