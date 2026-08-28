import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users } from "../auth/auth.schema.js";
import { tasks } from "../tasks/tasks.schema.js";

// A reusable "key:value" label catalog, scoped per user (e.g. client:acme,
// project:event_based_improvements) — matches the per-user data model used
// throughout the app (tasks, timer settings).
export const labels = sqliteTable(
  "labels",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("labels_user_key_value_unique").on(table.userId, table.key, table.value)]
);

export const taskLabels = sqliteTable(
  "task_labels",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId] }),
    index("task_labels_label_idx").on(table.labelId),
  ]
);
