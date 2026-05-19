import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import dealsRouter from "./deals";
import imagesRouter from "./images";
import agenteRouter from "./agente";
import authRouter from "./auth";
import statsRouter from "./stats";
import reviewsRouter from "./reviews";
import repliesRouter from "./replies";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(dealsRouter);
router.use(imagesRouter);
router.use(agenteRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(reviewsRouter);
router.use(repliesRouter);

export default router;
