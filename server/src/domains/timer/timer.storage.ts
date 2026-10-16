import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { SOUNDS_DIR, UPLOAD_TMP_DIR } from "../../config.js";

// The filesystem counterpart to timer.repository: the only module that
// touches sound files on disk, so the service can own the "replace a user's
// sound" rule without reaching for fs itself.

export function ensureSoundDirs() {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
}

// A declared audio/wav mimetype is only the uploader's claim — check the
// RIFF/WAVE magic bytes before the file is ever moved somewhere servable.
export function isWavFile(filePath: string): boolean {
  const header = Buffer.alloc(12);
  const fd = fs.openSync(filePath, "r");
  try {
    const bytesRead = fs.readSync(fd, header, 0, 12, 0);
    if (bytesRead < 12) return false;
  } finally {
    fs.closeSync(fd);
  }
  return header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WAVE";
}

// Moves a staged upload into the served directory under a generated name,
// returning the filename to persist against the user's settings.
export function promoteSound(tempPath: string, userId: string): string {
  ensureSoundDirs();
  const filename = `${userId}-${nanoid(10)}.wav`;
  fs.renameSync(tempPath, path.join(SOUNDS_DIR, filename));
  return filename;
}

export function discardUpload(tempPath: string) {
  fs.rm(tempPath, { force: true }, () => {});
}

export function deleteSound(filename: string | null) {
  if (!filename) return;
  fs.rm(path.join(SOUNDS_DIR, filename), { force: true }, () => {});
}
