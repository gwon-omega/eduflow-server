import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getProfile } from "../controllers/getProfile.controller";
import { updateProfile } from "../controllers/updateProfile.controller";
import { getInstituteTeachers } from "../controllers/getInstituteTeachers.controller";
import { getTeacherCourses } from "../controllers/getTeacherCourses.controller";
import { getTeacherStats } from "../controllers/getTeacherStats.controller";

const router = Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/courses", authenticate, getTeacherCourses);
router.get("/dashboard/stats", authenticate, getTeacherStats);
router.get("/institute/all", authenticate, getInstituteTeachers);

export default router;
