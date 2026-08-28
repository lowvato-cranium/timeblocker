import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { tasks } from "./tasks.schema.js";
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
};
