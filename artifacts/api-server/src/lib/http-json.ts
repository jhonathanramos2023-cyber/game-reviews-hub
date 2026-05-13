import type { Response } from "express";

/** Explicit 200 + JSON for API success responses (avoids ambiguous defaults with caches/proxies). */
export function json200<T>(res: Response, data: T): Response {
  return res.status(200).json(data);
}
