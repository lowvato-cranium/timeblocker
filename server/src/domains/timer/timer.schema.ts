import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "../auth/auth.schema.js";

export const timerSettings = sqliteTable("timer_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  workMinutes: integer("work_minutes").notNull().default(25),
  otherMinutes: integer("other_minutes").notNull().default(5),
});
