import { nanoid } from "nanoid";
import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { tasksRepository } from "./tasks.repository.js";
import { TASK_STATUSES, type TaskSession, type TaskStatus } from "./tasks.types.js";

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

  update(
    userId: string,
    id: string,
    patch: { description?: string; notes?: string; status?: string; active?: boolean }
  ) {
    const existing = tasksRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Task not found");

    const now = Date.now();
    const update: Partial<{
      description: string;
      notes: string;
      status: TaskStatus;
      active: boolean;
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
    if (patch.active !== undefined) {
      update.active = patch.active;
    }

    return tasksRepository.update(id, userId, update);
  },

  remove(userId: string, id: string) {
    const existing = tasksRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Task not found");
    tasksRepository.delete(id, userId);
  },

  sessionsForTask(taskId: string) {
    return tasksRepository.listSessionsForTask(taskId);
  },

  sessionsForTasks(taskIds: string[]) {
    const rows = tasksRepository.listSessionsForTasks(taskIds);
    const map = new Map<string, TaskSession[]>();
    for (const row of rows) {
      const list = map.get(row.taskId) ?? [];
      list.push(row);
      map.set(row.taskId, list);
    }
    return map;
  },

  // Single-task session control — used when a task's Active checkbox is
  // toggled while the Focus Timer's Work phase is already running, so that
  // task starts/stops receiving credit immediately rather than waiting for
  // the next Work phase boundary.
  startSession(taskId: string) {
    if (!tasksRepository.findOpenSession(taskId)) {
      tasksRepository.createSession({ id: nanoid(), taskId, startedAt: Date.now() });
    }
    return tasksRepository.listSessionsForTask(taskId);
  },

  stopSession(taskId: string) {
    const open = tasksRepository.findOpenSession(taskId);
    if (open) tasksRepository.closeSession(open.id, Date.now());
    return tasksRepository.listSessionsForTask(taskId);
  },

  // Bulk session control — used when the Focus Timer's Work phase itself
  // starts or ends, applying to every task currently marked Active.
  startActiveSessions(userId: string) {
    const now = Date.now();
    for (const task of tasksRepository.listActiveByUser(userId)) {
      if (!tasksRepository.findOpenSession(task.id)) {
        tasksRepository.createSession({ id: nanoid(), taskId: task.id, startedAt: now });
      }
    }
  },

  stopActiveSessions(userId: string) {
    const now = Date.now();
    for (const task of tasksRepository.listActiveByUser(userId)) {
      const open = tasksRepository.findOpenSession(task.id);
      if (open) tasksRepository.closeSession(open.id, now);
    }
  },
};
