export interface TimerSettings {
  workMinutes: number;
  otherMinutes: number;
}

export type TimerPhase = "idle" | "work" | "other";
