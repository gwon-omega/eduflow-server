import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getProfile } from "../controllers/getProfile.controller";
import { getStudents } from "../controllers/getStudents.controller";
import { getStudentById } from "../controllers/getStudentById.controller";
import { createStudent } from "../controllers/createStudent.controller";
import { updateProfile } from "../controllers/updateProfile.controller";
import { deleteStudent } from "../controllers/deleteStudent.controller";
import { getEnrolledCourses } from "../controllers/getEnrolledCourses.controller";
import { getStudentStats } from "../controllers/getStudentStats.controller";
import { getStudentAssignments } from "../controllers/getStudentAssignments.controller";
import { getStudentResults } from "../controllers/getStudentResults.controller";
import { getStudentAttendance } from "../controllers/getStudentAttendance.controller";
import { getStudentSchedule } from "../controllers/getStudentSchedule.controller";
import { getStudentDeadlines } from "../controllers/getStudentDeadlines.controller";
import { getStudentActivity } from "../controllers/getStudentActivity.controller";
import { getStudentCourseProgress } from "../controllers/getStudentCourseProgress.controller";
import { enrollInCourse, getStudentGPA } from "../controllers/studentSISActions.controller";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, upload.single("studentImage"), updateProfile);
router.get("/assignments", authenticate, getStudentAssignments);
router.get("/results", authenticate, getStudentResults);
router.get("/stats", authenticate, getStudentStats);

// New SIS Routes
router.get("/attendance", authenticate, getStudentAttendance);
router.get("/schedule", authenticate, getStudentSchedule);
router.get("/deadlines", authenticate, getStudentDeadlines);
router.get("/activity/learning", authenticate, getStudentActivity);
router.get("/courses/progress", authenticate, getStudentCourseProgress);
router.post("/courses/enroll", authenticate, enrollInCourse);
router.get("/gpa/:terminalId", authenticate, getStudentGPA);

router.get("/institute/all", authenticate, getStudents);
router.get("/", authenticate, getStudents);
router.get("/:id", authenticate, getStudentById);
router.post("/", authenticate, upload.single("studentImage"), createStudent);
router.delete("/:id", authenticate, deleteStudent);

export default router;
