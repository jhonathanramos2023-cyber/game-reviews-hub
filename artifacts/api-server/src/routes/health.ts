import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { json200 } from "../lib/http-json";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  json200(res, data);
});

export default router;
