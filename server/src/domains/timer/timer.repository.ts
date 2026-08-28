import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { timerSettings } from "./timer.schema.js";

export const timerRepository = {
  find(userId: string) {
    return db.select().from(timerSettings).where(eq(timerSettings.userId, userId)).get();
  },

  upsert(userId: string, values: { workMinutes: number; otherMinutes: number }) {
    db.insert(timerSettings)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: timerSettings.userId, set: values })
      .run();
    return this.find(userId)!;
  },
};
