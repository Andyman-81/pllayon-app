import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import athleteRouter from "./athlete";
import phase0Router from "./phase0";
import weeklyRouter from "./weekly";
import competitionRouter from "./competition";
import checkinRouter from "./checkin";
import capstoneRouter from "./capstone";
import sleepRouter from "./sleep";
import progressRouter from "./progress";
import scheduleRouter from "./schedule";
import cycleRouter from "./cycle";
import coachRouter from "./coach";
import parentRouter from "./parent";
import dailyReflectionRouter from "./daily-reflection";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(athleteRouter);
router.use(phase0Router);
router.use(weeklyRouter);
router.use(competitionRouter);
router.use(checkinRouter);
router.use(capstoneRouter);
router.use(sleepRouter);
router.use(progressRouter);
router.use(scheduleRouter);
router.use(cycleRouter);
router.use(coachRouter);
router.use(parentRouter);
router.use(dailyReflectionRouter);

export default router;
