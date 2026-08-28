import { nanoid } from "nanoid";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { tasksRepository } from "./tasks.repository.js";
import { TASK_STATUSES, type TaskStatus } from "./tasks.types.js";

export const tasksService = {
  list(userId: string) {
    return tasksRepository.listByUser(userId);
  },

  getOwned(userId: string, id: string) {
    const task = tasksRepository.findById(id, userId);
    if (!task) throw new NotFoundError("Task not found");
    return task;
  },

  create(userId: string, description: string) {
    const trimmed = description.trim();
    if (!trimmed) throw new ValidationError("Task description is required");
    const now = Date.now();
    return tasksRepository.create({
      id: nanoid(),
      userId,
      description: trimmed,
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
    });
  },

  update(userId: string, id: string, patch: { description?: string; notes?: string; status?: string }) {
    const existing = tasksRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Task not found");

    const now = Date.now();
    const update: Partial<{
      description: string;
      notes: string;
      status: TaskStatus;
      updatedAt: number;
      statusChangedAt: number;
    }> = { updatedAt: now };

    if (patch.description !== undefined) {
      const trimmed = patch.description.trim();
      if (!trimmed) throw new ValidationError("Task description is required");
      update.description = trimmed;
    }
    if (patch.notes !== undefined) {
      update.notes = patch.notes;
    }
    if (patch.status !== undefined) {
      if (!TASK_STATUSES.includes(patch.status as TaskStatus)) throw new ValidationError("Invalid status");
      update.status = patch.status as TaskStatus;
      if (update.status !== existing.status) {
        update.statusChangedAt = now;
      }
    }

    return tasksRepository.update(id, userId, update);
  },

  remove(userId: string, id: string) {
    const existing = tasksRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Task not found");
    tasksRepository.delete(id, userId);
  },
};
