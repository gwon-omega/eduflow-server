import { Router } from "express";
import { getAttendanceStats } from "../controllers/getAttendanceStats.controller";
import { getAssessmentPerformance } from "../controllers/getAssessmentPerformance.controller";
import { getPlatformStats } from "../controllers/getPlatformStats.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

router.get("/attendance", authenticate, getAttendanceStats);
router.get("/performance/:courseId", authenticate, getAssessmentPerformance);
router.get("/platform-stats", authenticate, getPlatformStats);

export default router;
