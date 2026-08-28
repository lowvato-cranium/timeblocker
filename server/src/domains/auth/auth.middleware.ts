import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE } from "./auth.constants.js";
import { authService } from "./auth.service.js";
import type { AuthUser } from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  const user = authService.resolveSession(sessionId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = user;
  next();
}
