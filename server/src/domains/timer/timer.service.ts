import { ValidationError } from "../../shared/errors.js";
import { timerRepository } from "./timer.repository.js";
import { NOTIFICATION_MODES, type NotificationMode, type TimerSettings } from "./timer.types.js";

const DEFAULT_SETTINGS: Omit<TimerSettings, "customSoundFilename"> & { customSoundFilename: null } = {
  workMinutes: 25,
  otherMinutes: 5,
  notificationMode: "sound",
  customSoundFilename: null,
};

function assertValidMinutes(value: number, field: string) {
  if (!Number.isInteger(value) || value < 1 || value > 180) {
    throw new ValidationError(`${field} must be a whole number of minutes between 1 and 180`);
  }
}

export const timerService = {
  get(userId: string) {
    return timerRepository.find(userId) ?? { userId, ...DEFAULT_SETTINGS };
  },

  update(userId: string, workMinutes: number, otherMinutes: number, notificationMode?: string) {
    assertValidMinutes(workMinutes, "workMinutes");
    assertValidMinutes(otherMinutes, "otherMinutes");

    const values: Partial<{ workMinutes: number; otherMinutes: number; notificationMode: NotificationMode }> = {
      workMinutes,
      otherMinutes,
    };
    if (notificationMode !== undefined) {
      if (!NOTIFICATION_MODES.includes(notificationMode as NotificationMode)) {
        throw new ValidationError("Invalid notification mode");
      }
      values.notificationMode = notificationMode as NotificationMode;
    }

    return timerRepository.upsert(userId, values);
  },

  // Returns the filename that was previously in use (if any) so the caller
  // can delete that file from disk now that it's no longer referenced.
  setCustomSound(userId: string, filename: string): { settings: TimerSettings; previousFilename: string | null } {
    const previousFilename = timerRepository.find(userId)?.customSoundFilename ?? null;
    const settings = timerRepository.upsert(userId, { customSoundFilename: filename, notificationMode: "sound" });
    return { settings, previousFilename };
  },

  clearCustomSound(userId: string): { settings: TimerSettings; previousFilename: string | null } {
    const previousFilename = timerRepository.find(userId)?.customSoundFilename ?? null;
    const settings = timerRepository.upsert(userId, { customSoundFilename: null });
    return { settings, previousFilename };
  },
};
