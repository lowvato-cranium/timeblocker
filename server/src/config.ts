import path from "path";
import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 4000);
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// Resolved against process.cwd(), which npm workspaces sets to server/ for
// both `npm run dev -w server` (tsx) and `npm run start` (node dist/index.js).
export const DATA_DIR = path.resolve(process.cwd(), "data");
export const MIGRATIONS_DIR = path.resolve(process.cwd(), "drizzle");

// Validated notification sounds, served (behind auth) at /uploads/sounds.
export const SOUNDS_DIR = path.join(DATA_DIR, "uploads", "sounds");
// Staging area for in-flight uploads, deliberately outside SOUNDS_DIR so a
// half-written or rejected file is never reachable from the served path.
export const UPLOAD_TMP_DIR = path.join(DATA_DIR, "uploads", "tmp");
