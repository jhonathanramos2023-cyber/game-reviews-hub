import type { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyToken, type AuthTokenPayload } from "../lib/auth";

export type AuthenticatedRequest = Request & {
  auth?: AuthTokenPayload;
};

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.auth = payload;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Debes iniciar sesión" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
  }
  req.auth = payload;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.auth?.rol !== "admin") {
      res.status(403).json({ error: "Acceso de administrador requerido" });
      return;
    }
    next();
  });
}
