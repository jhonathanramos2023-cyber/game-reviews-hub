import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import dealsRouter from "./deals";
import imagesRouter from "./images";
import agenteRouter from "./agente";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(dealsRouter);
router.use(imagesRouter);
router.use(agenteRouter);

export default router;
