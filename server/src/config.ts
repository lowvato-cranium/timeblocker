import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 4000);
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
