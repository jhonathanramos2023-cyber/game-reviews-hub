import type { CookieOptions } from "express";

/** Cross-origin SPA (Render static site) needs SameSite=None + Secure in production. */
export function authCookieOptions(maxAgeMs?: number): CookieOptions {
  const production = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/",
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  };
}
