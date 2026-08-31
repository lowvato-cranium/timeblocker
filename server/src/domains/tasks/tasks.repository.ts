import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { taskSessions, tasks } from "./tasks.schema.js";
import type { TaskStatus } from "./tasks.types.js";

export const tasksRepository = {
  listByUser(userId: string) {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt)).all();
  },

  findById(id: string, userId: string) {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .get();
  },

  create(task: {
    id: string;
    userId: string;
    description: string;
    createdAt: number;
    updatedAt: number;
    statusChangedAt: number;
  }) {
    db.insert(tasks).values(task).run();
    return this.findById(task.id, task.userId)!;
  },

  update(
    id: string,
    userId: string,
    patch: Partial<{
      description: string;
      notes: string;
      status: TaskStatus;
      active: boolean;
      updatedAt: number;
      statusChangedAt: number;
    }>
  ) {
    db.update(tasks)
      .set(patch)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .run();
    return this.findById(id, userId);
  },

  delete(id: string, userId: string) {
    db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .run();
  },

  listActiveByUser(userId: string) {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.active, true)))
      .all();
  },

  findOpenSession(taskId: string) {
    return db
      .select()
      .from(taskSessions)
      .where(and(eq(taskSessions.taskId, taskId), isNull(taskSessions.endedAt)))
      .get();
  },

  createSession(session: { id: string; taskId: string; startedAt: number; endedAt?: number }) {
    db.insert(taskSessions).values(session).run();
  },

  closeSession(id: string, endedAt: number) {
    db.update(taskSessions).set({ endedAt }).where(eq(taskSessions.id, id)).run();
  },

  listSessionsForTask(taskId: string) {
    return db.select().from(taskSessions).where(eq(taskSessions.taskId, taskId)).orderBy(asc(taskSessions.startedAt)).all();
  },

  listSessionsForTasks(taskIds: string[]) {
    if (taskIds.length === 0) return [];
    return db
      .select()
      .from(taskSessions)
      .where(inArray(taskSessions.taskId, taskIds))
      .orderBy(asc(taskSessions.startedAt))
      .all();
  },
};
