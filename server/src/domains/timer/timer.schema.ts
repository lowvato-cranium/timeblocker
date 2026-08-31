import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "../auth/auth.schema.js";
import { NOTIFICATION_MODES } from "./timer.types.js";

export const timerSettings = sqliteTable("timer_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  workMinutes: integer("work_minutes").notNull().default(25),
  otherMinutes: integer("other_minutes").notNull().default(5),
  notificationMode: text("notification_mode", { enum: NOTIFICATION_MODES }).notNull().default("sound"),
  // Filename under data/uploads/sounds/, or null to use the built-in ding.
  customSoundFilename: text("custom_sound_filename"),
});
