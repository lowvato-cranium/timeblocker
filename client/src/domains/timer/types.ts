export const NOTIFICATION_MODES = ["sound", "pulse", "none"] as const;
export type NotificationMode = (typeof NOTIFICATION_MODES)[number];

export const NOTIFICATION_MODE_LABELS: Record<NotificationMode, string> = {
  sound: "Play a sound",
  pulse: "Pulse the background",
  none: "Nothing",
};

export interface TimerSettings {
  workMinutes: number;
  otherMinutes: number;
  notificationMode: NotificationMode;
  customSoundFilename: string | null;
}

export type TimerPhase = "idle" | "work" | "other";
