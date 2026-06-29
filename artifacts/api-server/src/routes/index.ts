import { Router, type IRouter } from "express";
import healthRouter from "./health";
import totoRouter from "./toto";
import predictionsRouter from "./predictions";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/toto", totoRouter);
router.use("/predictions", predictionsRouter);

export default router;
