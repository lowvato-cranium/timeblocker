import { ValidationError } from "../../shared/errors.js";
import { timerRepository } from "./timer.repository.js";

const DEFAULT_SETTINGS = { workMinutes: 25, otherMinutes: 5 };

function assertValidMinutes(value: number, field: string) {
  if (!Number.isInteger(value) || value < 1 || value > 180) {
    throw new ValidationError(`${field} must be a whole number of minutes between 1 and 180`);
  }
}

export const timerService = {
  get(userId: string) {
    return timerRepository.find(userId) ?? { userId, ...DEFAULT_SETTINGS };
  },

  update(userId: string, workMinutes: number, otherMinutes: number) {
    assertValidMinutes(workMinutes, "workMinutes");
    assertValidMinutes(otherMinutes, "otherMinutes");
    return timerRepository.upsert(userId, { workMinutes, otherMinutes });
  },
};
