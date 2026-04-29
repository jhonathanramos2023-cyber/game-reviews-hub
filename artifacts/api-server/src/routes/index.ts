import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import dealsRouter from "./deals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(dealsRouter);

export default router;
