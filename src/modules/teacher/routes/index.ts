import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getProfile } from "../controllers/getProfile.controller";
import { updateProfile } from "../controllers/updateProfile.controller";
import { getInstituteTeachers } from "../controllers/getInstituteTeachers.controller";
import { getTeacherCourses } from "../controllers/getTeacherCourses.controller";
import { getTeacherStats } from "../controllers/getTeacherStats.controller";
import { getTeacherStudents } from "../controllers/getTeacherStudents.controller";
import { getTeacherSchedule } from "../controllers/getTeacherSchedule.controller";
import { getTeacherAssignments } from "../controllers/getTeacherAssignments.controller";
import { createTeacher } from "../controllers/createTeacher.controller";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/courses", authenticate, getTeacherCourses);
router.get("/dashboard/stats", authenticate, getTeacherStats);
router.get("/students", authenticate, getTeacherStudents);
router.get("/schedule", authenticate, getTeacherSchedule);
router.get("/assignments", authenticate, getTeacherAssignments);
router.get("/institute/all", authenticate, getInstituteTeachers);
router.get("/", authenticate, getInstituteTeachers);
router.post("/", authenticate, upload.single("teacherPhoto"), createTeacher);

export default router;
