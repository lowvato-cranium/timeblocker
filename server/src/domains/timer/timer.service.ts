import { ValidationError } from "../../shared/errors.js";
import { timerRepository } from "./timer.repository.js";
import { deleteSound, discardUpload, isWavFile, promoteSound } from "./timer.storage.js";
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

  // Owns the whole replacement rule: validate the staged upload, move it
  // into the served directory, point the user's settings at it, and only
  // then drop the file it replaced — so a failure at any step leaves the
  // previous sound both on disk and referenced.
  setCustomSound(userId: string, tempPath: string): TimerSettings {
    if (!isWavFile(tempPath)) {
      discardUpload(tempPath);
      throw new ValidationError("File content is not a valid WAV file");
    }

    const previousFilename = timerRepository.find(userId)?.customSoundFilename ?? null;
    const filename = promoteSound(tempPath, userId);
    const settings = timerRepository.upsert(userId, {
      customSoundFilename: filename,
      notificationMode: "sound",
    });
    deleteSound(previousFilename);
    return settings;
  },

  clearCustomSound(userId: string): TimerSettings {
    const previousFilename = timerRepository.find(userId)?.customSoundFilename ?? null;
    const settings = timerRepository.upsert(userId, { customSoundFilename: null });
    deleteSound(previousFilename);
    return settings;
  },
};
