import { eq, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { sessions, users } from "./auth.schema.js";

export const authRepository = {
  findUserByUsername(username: string) {
    return db.select().from(users).where(eq(users.username, username)).get();
  },

  findUserById(id: string) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },

  createUser(user: { id: string; username: string; passwordHash: string; createdAt: number }) {
    db.insert(users).values(user).run();
  },

  createSession(session: { id: string; userId: string; expiresAt: number; createdAt: number }) {
    db.insert(sessions).values(session).run();
  },

  findSession(id: string) {
    return db.select().from(sessions).where(eq(sessions.id, id)).get();
  },

  deleteSession(id: string) {
    db.delete(sessions).where(eq(sessions.id, id)).run();
  },

  deleteExpiredSessions(now: number) {
    db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
  },
};
