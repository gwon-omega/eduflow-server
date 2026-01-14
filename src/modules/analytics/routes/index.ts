import { Router } from "express";
import { getAttendanceStats } from "../controllers/getAttendanceStats.controller";
import { getAssessmentPerformance } from "../controllers/getAssessmentPerformance.controller";
import { getPlatformStats } from "../controllers/getPlatformStats.controller";
import { getAllUsers, getSystemHealth, getRevenueAnalytics } from "../controllers/adminAnalytics.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

router.get("/attendance", authenticate, getAttendanceStats);
router.get("/performance/:courseId", authenticate, getAssessmentPerformance);
router.get("/platform-stats", authenticate, getPlatformStats);

// Admin-only analytics
router.get("/admin/users", authenticate, getAllUsers);
router.get("/admin/health", authenticate, getSystemHealth);
router.get("/admin/revenue", authenticate, getRevenueAnalytics);

export default router;
