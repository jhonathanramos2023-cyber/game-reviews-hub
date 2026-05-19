import jwt from "jsonwebtoken";
import type { Response } from "express";

export type AuthTokenPayload = {
  sub: string;
  nombre: string;
  email: string;
  rol: string;
};

const COOKIE_NAME = "gr_token";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production (min 16 characters)");
  }
  return "dev-only-change-me-in-production";
}

export function signToken(payload: AuthTokenPayload, rememberMe: boolean): string {
  const expiresIn = rememberMe ? "30d" : "7d";
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string, rememberMe: boolean): void {
  const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const secure = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function getTokenFromRequest(req: {
  cookies?: Record<string, string>;
  headers?: { authorization?: string };
}): string | null {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const auth = req.headers?.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export { COOKIE_NAME };
