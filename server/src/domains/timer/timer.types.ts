export const NOTIFICATION_MODES = ["sound", "pulse", "none"] as const;
export type NotificationMode = (typeof NOTIFICATION_MODES)[number];

export interface TimerSettings {
  workMinutes: number;
  otherMinutes: number;
  notificationMode: NotificationMode;
  customSoundFilename: string | null;
}
