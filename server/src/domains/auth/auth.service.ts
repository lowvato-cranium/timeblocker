import { nanoid } from "nanoid";
import { UnauthorizedError } from "../../shared/errors.js";
import { authRepository } from "./auth.repository.js";
import { SESSION_TTL_MS } from "./auth.constants.js";
import type { AuthUser } from "./auth.types.js";
import { hashPassword, verifyPassword } from "./password.js";

export const authService = {
  createUser(username: string, password: string): AuthUser {
    const existing = authRepository.findUserByUsername(username);
    if (existing) throw new Error(`User "${username}" already exists`);

    const user = {
      id: nanoid(),
      username,
      passwordHash: hashPassword(password),
      createdAt: Date.now(),
    };
    authRepository.createUser(user);
    return { id: user.id, username: user.username };
  },

  login(username: string, password: string): { user: AuthUser; sessionId: string; expiresAt: number } {
    const user = authRepository.findUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError("Invalid username or password");
    }

    authRepository.deleteExpiredSessions(Date.now());

    const sessionId = nanoid(32);
    const expiresAt = Date.now() + SESSION_TTL_MS;
    authRepository.createSession({ id: sessionId, userId: user.id, expiresAt, createdAt: Date.now() });

    return { user: { id: user.id, username: user.username }, sessionId, expiresAt };
  },

  logout(sessionId: string) {
    authRepository.deleteSession(sessionId);
  },

  resolveSession(sessionId: string | undefined): AuthUser | null {
    if (!sessionId) return null;
    const session = authRepository.findSession(sessionId);
    if (!session || session.expiresAt < Date.now()) return null;
    const user = authRepository.findUserById(session.userId);
    if (!user) return null;
    return { id: user.id, username: user.username };
  },
};
