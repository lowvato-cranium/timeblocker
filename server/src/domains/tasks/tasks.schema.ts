import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "../auth/auth.schema.js";
import { TASK_STATUSES } from "./tasks.types.js";

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    notes: text("notes").notNull().default(""),
    status: text("status", { enum: TASK_STATUSES }).notNull().default("incomplete"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    // Nullable at the DB level so adding this column to existing rows needs
    // no default; the service layer always sets it on create/status-change,
    // and the migration backfills pre-existing rows from created_at.
    statusChangedAt: integer("status_changed_at"),
  },
  (table) => [index("tasks_user_idx").on(table.userId)]
);
