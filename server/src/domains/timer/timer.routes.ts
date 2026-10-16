import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { UPLOAD_TMP_DIR } from "../../config.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { ValidationError } from "../../shared/errors.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { timerService } from "./timer.service.js";
import { ensureSoundDirs } from "./timer.storage.js";

ensureSoundDirs();

const ALLOWED_MIME_TYPES = ["audio/wav", "audio/wave", "audio/x-wav", "audio/vnd.wave"];

// Uploads land in the staging directory; the service validates the content
// and promotes the file into the served directory from there.
const upload = multer({
  dest: UPLOAD_TMP_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      // A ValidationError (not a bare Error) so the app-level handler in
      // index.ts answers 400 rather than a generic 500.
      cb(new ValidationError("Only WAV audio files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const timerRouter = Router();
timerRouter.use(requireAuth);

timerRouter.get("/settings", (req, res) => {
  res.json({ settings: timerService.get(req.user!.id) });
});

timerRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const { workMinutes, otherMinutes, notificationMode } = req.body ?? {};
    const settings = timerService.update(
      req.user!.id,
      Number(workMinutes),
      Number(otherMinutes),
      notificationMode
    );
    res.json({ settings });
  })
);

timerRouter.post(
  "/sound",
  upload.single("sound"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    res.json({ settings: timerService.setCustomSound(req.user!.id, req.file.path) });
  })
);

timerRouter.delete("/sound", (req, res) => {
  res.json({ settings: timerService.clearCustomSound(req.user!.id) });
});

// Multer's own errors (oversized file, malformed multipart) aren't AppErrors,
// so translate just those; everything else — AppError included — carries on
// to the app-level handler in index.ts, which owns status codes. Registered
// last so it covers every route above it.
timerRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});
