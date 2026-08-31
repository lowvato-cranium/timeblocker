import "./db/client.js"; // ensures the DB exists and migrations are applied before anything else

import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { CORS_ORIGIN, IS_PRODUCTION, PORT } from "./config.js";
import { authRouter } from "./domains/auth/auth.routes.js";
import { requireAuth } from "./domains/auth/auth.middleware.js";
import { labelsRouter } from "./domains/labels/labels.routes.js";
import { tasksRouter } from "./domains/tasks/tasks.routes.js";
import { timerRouter } from "./domains/timer/timer.routes.js";
import { AppError } from "./shared/errors.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// Throttle login attempts to slow down credential brute-forcing.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", loginLimiter);

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/timer", timerRouter);
app.use("/api/labels", labelsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const soundsDir = path.resolve(process.cwd(), "data", "uploads", "sounds");
fs.mkdirSync(soundsDir, { recursive: true });
app.use("/uploads/sounds", requireAuth, express.static(soundsDir));

if (IS_PRODUCTION) {
  const clientDist = path.resolve(process.cwd(), "../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
