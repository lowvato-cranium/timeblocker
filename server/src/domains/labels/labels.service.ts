import { nanoid } from "nanoid";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { labelsRepository } from "./labels.repository.js";
import type { Label } from "./labels.types.js";

export const labelsService = {
  list(userId: string) {
    return labelsRepository.listByUser(userId);
  },

  findOrCreate(userId: string, rawKey: string, rawValue: string): Label {
    const key = rawKey.trim();
    const value = rawValue.trim();
    if (!key || !value) {
      throw new ValidationError('Label must have both a key and a value, e.g. "client:acme"');
    }

    const existing = labelsRepository.findByKeyValue(userId, key, value);
    if (existing) return existing;

    return labelsRepository.create({ id: nanoid(), userId, key, value, createdAt: Date.now() });
  },

  attachToTask(userId: string, taskId: string, rawKey: string, rawValue: string) {
    const label = this.findOrCreate(userId, rawKey, rawValue);
    labelsRepository.link(taskId, label.id);
    return labelsRepository.listForTask(taskId);
  },

  detachFromTask(userId: string, taskId: string, labelId: string) {
    const label = labelsRepository.findById(labelId, userId);
    if (!label) throw new NotFoundError("Label not found");
    labelsRepository.unlink(taskId, labelId);
    return labelsRepository.listForTask(taskId);
  },

  forTask(taskId: string) {
    return labelsRepository.listForTask(taskId);
  },

  forTasks(taskIds: string[]) {
    const rows = labelsRepository.listForTasks(taskIds);
    const map = new Map<string, Label[]>();
    for (const { taskId, ...label } of rows) {
      const list = map.get(taskId) ?? [];
      list.push(label);
      map.set(taskId, list);
    }
    return map;
  },
};
