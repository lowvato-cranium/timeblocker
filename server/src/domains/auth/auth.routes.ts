import { Router } from "express";
import { IS_PRODUCTION } from "../../config.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { SESSION_COOKIE } from "./auth.constants.js";
import { requireAuth } from "./auth.middleware.js";
import { authService } from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "username and password are required" });
      return;
    }

    const { user, sessionId, expiresAt } = authService.login(username, password);
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      expires: new Date(expiresAt),
    });
    res.json({ user });
  })
);

authRouter.post("/logout", (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (sessionId) authService.logout(sessionId);
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
