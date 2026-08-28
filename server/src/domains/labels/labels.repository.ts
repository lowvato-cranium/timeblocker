import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { labels, taskLabels } from "./labels.schema.js";

export const labelsRepository = {
  listByUser(userId: string) {
    return db.select().from(labels).where(eq(labels.userId, userId)).orderBy(asc(labels.key), asc(labels.value)).all();
  },

  findByKeyValue(userId: string, key: string, value: string) {
    return db
      .select()
      .from(labels)
      .where(and(eq(labels.userId, userId), eq(labels.key, key), eq(labels.value, value)))
      .get();
  },

  findById(id: string, userId: string) {
    return db
      .select()
      .from(labels)
      .where(and(eq(labels.id, id), eq(labels.userId, userId)))
      .get();
  },

  create(label: { id: string; userId: string; key: string; value: string; createdAt: number }) {
    db.insert(labels).values(label).run();
    return this.findById(label.id, label.userId)!;
  },

  link(taskId: string, labelId: string) {
    db.insert(taskLabels).values({ taskId, labelId }).onConflictDoNothing().run();
  },

  unlink(taskId: string, labelId: string) {
    db.delete(taskLabels)
      .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)))
      .run();
  },

  listForTask(taskId: string) {
    return db
      .select({ id: labels.id, userId: labels.userId, key: labels.key, value: labels.value, createdAt: labels.createdAt })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(eq(taskLabels.taskId, taskId))
      .orderBy(asc(labels.key), asc(labels.value))
      .all();
  },

  listForTasks(taskIds: string[]) {
    if (taskIds.length === 0) return [];
    return db
      .select({
        taskId: taskLabels.taskId,
        id: labels.id,
        userId: labels.userId,
        key: labels.key,
        value: labels.value,
        createdAt: labels.createdAt,
      })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(inArray(taskLabels.taskId, taskIds))
      .orderBy(asc(labels.key), asc(labels.value))
      .all();
  },
};
