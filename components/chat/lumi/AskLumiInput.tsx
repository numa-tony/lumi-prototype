"use client";

// The "Ask Lumi" field — Figma's Input component (7047:9026), one implementation.
//
// There were three composers before this: the live `Composer`'s real textarea,
// `ThreadView`'s `IdleInput` card, and a read-only pill local to
// `StoryThreadView`. All three drew the same control differently. This is the
// pill both chats now share; whether it is driven by a real textarea or by a
// scripted draft is the caller's business, not the field's.
//
// Elevation/1 shadow, spacing/l left · spacing/s right and vertical,
// Label/Medium/Regular placeholder in content/base/secondary, 32px trailing
// button on background/base/secondary.

export interface AskLumiInputProps {
  /** Text typed so far. Empty renders the placeholder and the mic. */
  draft?: string;
  placeholder?: string;
  /** Gutter either side of the pill. The start screen frame uses spacing/s;
   *  the conversation frame (7229-13293) uses 24. */
  gutter?: number;
  /** Gap from the pill to the foot of the screen. */
  foot?: number;
  onSend?: () => void;
  onMic?: () => void;
}

export function AskLumiInput({
  draft = "",
  placeholder = "Ask Lumi",
  gutter = 12,
  foot = 32,
  onSend,
  onMic,
}: AskLumiInputProps) {
  const typing = draft.length > 0;

  return (
    // No backdrop blur, despite the frame asking for 2px: the phone's rounded
    // clip means a backdrop-filter region samples the bezel outside it and
    // smears grey into the sheet's bottom corners. See decisions.md.
    <div className="shrink-0 pt-2" style={{ paddingLeft: gutter, paddingRight: gutter, paddingBottom: foot }}>
      <div
        className="flex w-full items-center justify-between rounded-full py-[12px] pl-[20px] pr-[12px]"
        style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0px 10px 40px 0px rgba(0,0,0,0.1)" }}
      >
        {/* Wraps rather than clipping, so a long scripted message stays
            readable as it types — the pill grows the way an iOS field does. */}
        <span className="min-w-0 flex-1 text-[16px] font-light leading-[20px] tracking-[-0.2px]">
          {typing ? (
            <>
              <span className="text-text">{draft}</span>
              {/* Figma draws the caret as a 2px round-capped rule in blue-300 */}
              <span className="ml-px inline-block h-[20px] w-[2px] animate-pulse rounded-full bg-[var(--color-blue-300)] align-middle" />
            </>
          ) : (
            <span className="text-text-secondary">{placeholder}</span>
          )}
        </span>

        {/* Idle: mic on background/base/secondary. Typing: send on
            background/action/default — the field offers to send once there is
            something to send. */}
        <button
          type="button"
          onClick={typing ? onSend : onMic}
          aria-label={typing ? "Send" : "Speak to Lumi"}
          className="ml-3 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full"
          style={{ background: typing ? "var(--color-bg-action)" : "var(--color-bg-secondary)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={typing ? "/allhands/send-arrow.svg" : "/allhands/mic.svg"}
            alt=""
            className={typing ? "block h-[24px] w-[24px]" : "block h-[20px] w-[20px]"}
          />
        </button>
      </div>
    </div>
  );
}
