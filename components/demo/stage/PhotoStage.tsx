"use client";

// The photographic stage behind the phone — All-Hands' rooms and the train home.
//
// Two focus modes: the photo owns the stage (sharp, drifting, stamped with the
// time and place, phone below the frame), or the phone does (the photo sinks
// behind a scrim tinted with the room's own shadow colour, blurred and pushed
// back a touch). A glance lifts the scrim for a moment while the room itself
// changes, so the eye goes to the room exactly when there is something to see.
//
// All of it is CSS (app/globals.css, the .stage block): transitions for
// anything that can be interrupted, so a press mid-move retargets instead of
// jumping; keyframes only for one-shot entrances. No Framer — its springs are
// rAF-driven, and a surface whose appearance depends on an animation finishing
// is a liability on stage (decisions.md).
//
// Two slots rather than every photo mounted: the incoming photo enters in
// front, keyed by the backdrop's seq so its entrance always plays from the
// start; the outgoing one waits, whole, underneath. React keeps the outgoing
// node when it moves from front to back, so it never re-decodes, and decoded
// memory stays at two photos.
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { STAGE_PHOTOS, type StageAnchor, type StagePhoto } from "@/lib/demo/stagePhotos";
import type { StagePhotoId, StagePulse, StageVia } from "@/lib/demo/types";

const PHOTOS = STAGE_PHOTOS as Record<string, StagePhoto | undefined>;

const ENTER: Record<StageVia, string> = {
  cut: "",
  night: "", // swapped in the dark: the dip is the transition
  dissolve: "stage-in-dissolve",
  part: "stage-in-part",
  travel: "stage-in-travel",
};

/** Friday's faked dark (see Lights): the overlay's colour and strength. */
const LIGHTS_OFF = { rgb: [7, 3, 6] as const, alpha: 0.66 };
/** Behind the phone, a lights-off room sits this much darker than a lit one —
 *  enough to read as night, not so much that the room disappears. */
const NIGHT = 0.85;
/** With Friday's lights on, the room stays lifted behind the phone — as bright
 *  as a glance leaves it (the 0.35 in the .stage glance rule) — until she turns
 *  them off again. The lights coming on is the brightening; it doesn't fade. */
const LIGHTS_ON_LIFT = 0.35;

const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hexLuma = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return luma((n >> 16) & 255, (n >> 8) & 255, n & 255);
};

/**
 * Whether the Friday room is dark: from the first phone press until Lumi turns
 * the lights on — never on the opening frame (beat 0), which shows the room as
 * photographed. Keyed to the beat rather than to focus alone, or the room would
 * relight as the phone leaves for Saturday, straight after "Lights off".
 */
function useFridayDark(): boolean {
  const on = useApp((s) => s.smartRoom.lights.on);
  const focus = useApp((s) => s.demo.stage.focus);
  const beat = useApp((s) => s.demo.beatIndex);
  return !on && !(beat === 0 && focus === "scene");
}

/**
 * The scrim for Friday with its lights off. The manifest's alpha is solved for
 * the lit photo, and stacked on the dark overlay it buried the room behind the
 * phone at about half the other rooms' brightness. Re-solved here for the room
 * as it actually looks with the lights off, and aimed a touch below the lit
 * rooms (NIGHT) so it still reads as night.
 */
function nightAlpha(p: StagePhoto): number {
  const scrimL = hexLuma(p.scrim.color);
  const lit = p.seenLuma * (1 - p.scrim.alpha) + scrimL * p.scrim.alpha; // where the lit rooms land
  const darkPhoto = PHOTOS["ac-dark"];
  const seen = darkPhoto
    ? darkPhoto.seenLuma
    : p.seenLuma * (1 - LIGHTS_OFF.alpha) + luma(...LIGHTS_OFF.rgb) * LIGHTS_OFF.alpha;
  return Math.max(0, Math.min(0.94, (seen - NIGHT * lit) / (seen - scrimL)));
}

/**
 * Whether a backwards snap was in progress when this element mounted. Read
 * once: an entrance mounted during a snap must never start playing afterwards,
 * when the snap hands motion back.
 */
function useMountedDuringSnap(): boolean {
  const [snapped] = useState(() => useApp.getState().demo.stage.instant);
  return snapped;
}

/**
 * A box with the photo's aspect ratio that covers the viewport — object-fit:
 * cover, but with a coordinate system, so an anchor measured as a percentage
 * of the photo lands on the same pixel at any screen size.
 */
function Cover({ p, children }: { p: StagePhoto; children: React.ReactNode }) {
  const ar = p.width / p.height;
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: `max(100vw, calc(100vh * ${ar}))`,
        height: `max(100vh, calc(100vw / ${ar}))`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {children}
    </div>
  );
}

function Picture({ p }: { p: StagePhoto }) {
  return (
    // The blurred placeholder paints instantly underneath, so a photo still
    // decoding shows as its own soft version rather than a black hole.
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${p.placeholder})` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.fallback}
        srcSet={p.avif}
        sizes="100vw"
        alt=""
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
    </div>
  );
}

const pos = (a: StageAnchor | null | undefined, fx = 50, fy = 50) => `${a?.x ?? fx}% ${a?.y ?? fy}%`;

/**
 * Friday's photo has its lamps lit, but the story starts with them off. Until
 * there is a real lights-off render (`1b-` in the photo folder), the dark is an
 * overlay shaped to the room: deeper over the lamps and their pools.
 */
function Lights() {
  const on = useApp((s) => s.smartRoom.lights.on);
  const lit = !useFridayDark();
  const a = PHOTOS.ac?.anchors ?? {};
  const darkPhoto = PHOTOS["ac-dark"];
  return (
    <>
      {darkPhoto ? (
        <div className="stage-lights absolute inset-0" data-on={lit}>
          <Picture p={darkPhoto} />
        </div>
      ) : (
        <div
          className="stage-lights absolute inset-0"
          data-on={lit}
          style={{
            background: [
              `radial-gradient(ellipse 12% 16% at ${pos(a.pendant)}, rgba(0,0,0,0.62), transparent)`,
              `radial-gradient(ellipse 10% 14% at ${pos(a.desk)}, rgba(0,0,0,0.55), transparent)`,
              `rgba(${LIGHTS_OFF.rgb.join(", ")}, ${LIGHTS_OFF.alpha})`,
            ].join(", "),
          }}
        />
      )}
      {on && <LampCatch at={a.pendant} />}
    </>
  );
}

/** The pendant catching as the lights come on — a warm bloom that peaks and settles. */
function LampCatch({ at }: { at: StageAnchor | null | undefined }) {
  const snapped = useMountedDuringSnap();
  if (!at || snapped) return null;
  return <div className="stage-lamp-catch" style={{ left: `${at.x}%`, top: `${at.y}%` }} />;
}

function Slot({
  id,
  role,
  via,
  seam,
}: {
  id: StagePhotoId;
  role: "front" | "back";
  via: StageVia;
  seam: number;
}) {
  const snapped = useMountedDuringSnap();
  const p = PHOTOS[id];
  if (!p) return null;
  const enter = role === "front" && !snapped ? ENTER[via] : "";
  // Travel moves both places: the one being left drifts away underneath.
  const exit = role === "back" && via === "travel" ? "stage-out-travel" : "";
  return (
    <Cover p={p}>
      <div className={`absolute inset-0 ${enter} ${exit}`} style={{ ["--seam" as string]: `${seam}%` }}>
        <Picture p={p} />
        {id === "ac" && <Lights />}
      </div>
      {role === "front" && !snapped && via === "part" && (
        // The light that was leaking through the seam, spilling out as the
        // curtains give way. Outside the clipped layer so it leads the reveal.
        <div className="stage-seam-light" style={{ left: `${seam}%` }} />
      )}
    </Cover>
  );
}

const PULSE_CLASS: Record<StagePulse, string> = { cool: "stage-cool" };

/** A one-shot accent across the room — the cool breath when the AC is fixed. */
function Pulse({ name }: { name: StagePulse }) {
  const snapped = useMountedDuringSnap();
  if (snapped) return null;
  return <div className={`${PULSE_CLASS[name]} absolute inset-0`} />;
}

function Stamp() {
  const stamp = useApp((s) => s.demo.stage.stamp);
  return (
    <div className="stage-stamp absolute bottom-[7vh] left-[4.5vw] text-white">
      {/* Frosted glass — dark, translucent, blurred — so the line reads on any
          of the photos without laying a shade over the room. */}
      <div className="stage-stamp-card">
        <p className="stage-stamp-line text-[clamp(16px,1.3vw,24px)] font-semibold leading-tight tracking-[-0.2px]">
          {stamp?.when}
        </p>
        {stamp?.where && (
          <p className="stage-stamp-line mt-1 text-[clamp(13px,1vw,18px)] font-light leading-tight text-white/70">
            {stamp.where}
          </p>
        )}
      </div>
    </div>
  );
}

export function PhotoStage() {
  const stage = useApp((s) => s.demo.stage);

  // Warm the decode cache as soon as the story starts, so no photo arrives on
  // stage still decoding. Detached images with the same srcset and sizes pick
  // the same file the <img> will.
  useEffect(() => {
    for (const p of Object.values(PHOTOS)) {
      if (!p) continue;
      const img = new Image();
      img.decoding = "async";
      img.sizes = "100vw";
      img.srcset = p.avif;
      img.src = p.fallback;
      img.decode?.().catch(() => {});
    }
  }, []);

  const fridayDark = useFridayDark();
  const lightsOn = useApp((s) => s.smartRoom.lights.on);
  const active = stage.photo ? PHOTOS[stage.photo] : undefined;
  let scrimAlpha = active?.scrim.alpha ?? 0.8;
  if (active && stage.photo === "ac") {
    if (fridayDark) scrimAlpha = nightAlpha(active);
    else if (lightsOn) scrimAlpha = active.scrim.alpha * LIGHTS_ON_LIFT;
  }
  const seam = (stage.prevPhoto && PHOTOS[stage.prevPhoto]?.anchors.seam?.x) ?? 50;

  const slots: { key: string; id: StagePhotoId; role: "front" | "back" }[] = [];
  if (stage.prevPhoto) slots.push({ key: `${stage.prevPhoto}-${stage.prevSeq}`, id: stage.prevPhoto, role: "back" });
  if (stage.photo) slots.push({ key: `${stage.photo}-${stage.seq}`, id: stage.photo, role: "front" });

  return (
    <div
      className="stage pointer-events-none fixed inset-0 z-[6] overflow-hidden bg-black"
      data-focus={stage.focus}
      data-glance={stage.glance}
      data-dip={stage.dip}
      data-stamp={stage.focus === "scene" && !!stage.stamp}
      data-instant={stage.instant}
      style={{ ["--scrim-alpha" as string]: scrimAlpha }}
      aria-hidden
    >
      {/* The photos: focus breathing and blur outside, ambient drift inside. */}
      <div className="stage-focus absolute inset-0">
        <div className="stage-drift absolute inset-0">
          {slots.map((s) => (
            <Slot key={s.key} id={s.id} role={s.role} via={stage.via} seam={seam} />
          ))}
        </div>
      </div>

      <div className="stage-dip absolute inset-0 bg-black" />
      <div className="stage-scrim absolute inset-0" style={{ backgroundColor: active?.scrim.color ?? "#000" }} />

      {/* Accents read through the scrim, so they sit above it. */}
      {stage.pulse && <Pulse key={stage.pulse.seq} name={stage.pulse.name} />}

      <div className="stage-vignette absolute inset-0" />
      <div className="stage-grain absolute inset-0" />
      <Stamp />
    </div>
  );
}
