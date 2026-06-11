export type DoorState = "locked" | "unlocked" | "open";
export type LightWarmth = "warm" | "neutral" | "cool";
export type AcMode = "cool" | "heat" | "off";
export type DeviceType = "door" | "lights" | "tv" | "blinds" | "ac";

export interface SmartRoomDevices {
  door:   { state: DoorState };
  lights: { on: boolean; brightness: number; warmth: LightWarmth };
  tv:     { on: boolean; volume: number; muted: boolean; channel: string | null; app: string | null };
  blinds: { position: number };   // 0 = fully closed, 100 = fully open
  ac:     { mode: AcMode; setpoint: number };
  windowSky: "evening" | "morning";
  lastChangedAt: number;          // bumps on every change — triggers one-shot pulse on last device
  lastDevice: DeviceType | null;
}

export const INITIAL_SMART_ROOM: SmartRoomDevices = {
  door:   { state: "locked" },
  lights: { on: false, brightness: 70, warmth: "warm" },
  tv:     { on: false, volume: 30, muted: false, channel: null, app: null },
  blinds: { position: 0 },
  ac:     { mode: "off", setpoint: 21 },
  windowSky: "evening",
  lastChangedAt: 0,
  lastDevice: null,
};
