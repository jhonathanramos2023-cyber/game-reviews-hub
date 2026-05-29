import type { Request } from "express";
import { randomBytes } from "node:crypto";

export function getOAuthPublicBase(req: Request): string {
  const configured = process.env.OAUTH_CALLBACK_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const proto = (req.get("x-forwarded-proto") ?? req.protocol).split(",")[0]?.trim();
  const host = (req.get("x-forwarded-host") ?? req.get("host") ?? "").split(",")[0]?.trim();
  return `${proto}://${host}`;
}

export function getFrontendOrigin(): string {
  const raw =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
    "http://localhost:5173";
  return raw.replace(/\/+$/, "");
}

export function oauthStateToken(): string {
  return randomBytes(16).toString("hex");
}

export function googleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function facebookOAuthConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_APP_SECRET?.trim());
}

export interface OAuthProfile {
  provider: "google" | "facebook";
  providerId: string;
  email: string;
  nombre: string;
  avatarUrl: string | null;
}
