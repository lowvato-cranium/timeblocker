import fs from "fs";
import path from "path";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { timerService } from "./timer.service.js";

const soundsDir = path.resolve(process.cwd(), "data", "uploads", "sounds");
fs.mkdirSync(soundsDir, { recursive: true });

const upload = multer({
  dest: soundsDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["audio/wav", "audio/wave", "audio/x-wav", "audio/vnd.wave"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only WAV audio files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function sniffIsWav(buf: Buffer): boolean {
  return (
    buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WAVE"
  );
}

function deleteSoundFile(filename: string | null) {
  if (!filename) return;
  fs.rm(path.join(soundsDir, filename), { force: true }, () => {});
}

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

    const header = Buffer.alloc(12);
    const fd = fs.openSync(req.file.path, "r");
    fs.readSync(fd, header, 0, 12, 0);
    fs.closeSync(fd);

    if (!sniffIsWav(header)) {
      fs.rm(req.file.path, { force: true }, () => {});
      res.status(400).json({ error: "File content is not a valid WAV file" });
      return;
    }

    const finalName = `${req.user!.id}-${nanoid(10)}.wav`;
    fs.renameSync(req.file.path, path.join(soundsDir, finalName));

    const { settings, previousFilename } = timerService.setCustomSound(req.user!.id, finalName);
    deleteSoundFile(previousFilename);
    res.json({ settings });
  })
);

// Local handler for multer errors (oversized file, wrong type) so they come
// back as a friendly 400 instead of falling through to the app's generic
// 500 handler, which doesn't know about multer.MulterError.
timerRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError || err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

timerRouter.delete("/sound", (req, res) => {
  const { settings, previousFilename } = timerService.clearCustomSound(req.user!.id);
  deleteSoundFile(previousFilename);
  res.json({ settings });
});
