import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import questionsRouter from "./questions";
import answersRouter from "./answers";
import badgesRouter from "./badges";
import statsRouter from "./stats";
import reportsRouter from "./reports";
import storageRouter from "./storage";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(questionsRouter);
router.use(answersRouter);
router.use(badgesRouter);
router.use(statsRouter);
router.use(reportsRouter);
router.use(storageRouter);
router.use(adminRouter);

export default router;
