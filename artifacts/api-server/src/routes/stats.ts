import { Router, type IRouter } from "express";
import { json200 } from "../lib/http-json";

const router: IRouter = Router();

/** Realistic-looking online count based on time of day (UTC). */
function fakeOnlineCount(): number {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  const baseByHour = [
    42, 38, 35, 32, 30, 28, 35, 52, 78, 95, 112, 128, 135, 142, 148, 155, 162, 178, 195,
    210, 198, 175, 120, 68,
  ];
  const base = baseByHour[hour] ?? 80;
  const jitter = Math.floor((minute / 60) * 12) + (now.getUTCDate() % 7) * 2;
  const weekendBoost = [0, 6].includes(now.getUTCDay()) ? 18 : 0;
  return base + jitter + weekendBoost;
}

router.get("/stats/online", (_req, res) => {
  json200(res, { count: fakeOnlineCount() });
});

export default router;
