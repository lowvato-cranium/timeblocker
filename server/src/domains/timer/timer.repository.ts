import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { timerSettings } from "./timer.schema.js";
import type { NotificationMode } from "./timer.types.js";

export const timerRepository = {
  find(userId: string) {
    return db.select().from(timerSettings).where(eq(timerSettings.userId, userId)).get();
  },

  upsert(
    userId: string,
    values: Partial<{
      workMinutes: number;
      otherMinutes: number;
      notificationMode: NotificationMode;
      customSoundFilename: string | null;
    }>
  ) {
    db.insert(timerSettings)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: timerSettings.userId, set: values })
      .run();
    return this.find(userId)!;
  },
};
