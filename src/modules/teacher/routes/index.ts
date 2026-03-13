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
import { getCourseStudents } from "../controllers/getCourseStudents.controller";
import { getTeacherSubmissions } from "../controllers/getTeacherSubmissions.controller";
import { gradeTeacherSubmission } from "../controllers/gradeTeacherSubmission.controller";
import { createTeacherAssignment } from "../controllers/createTeacherAssignment.controller";
import { deleteTeacherAssignment } from "../controllers/deleteTeacherAssignment.controller";
import { createTeacher } from "../controllers/createTeacher.controller";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/courses", authenticate, getTeacherCourses);
router.get("/courses/:courseId/students", authenticate, getCourseStudents);
router.get("/dashboard/stats", authenticate, getTeacherStats);
router.get("/students", authenticate, getTeacherStudents);
router.get("/schedule", authenticate, getTeacherSchedule);
router.get("/assignments", authenticate, getTeacherAssignments);
router.post("/assignments", authenticate, createTeacherAssignment);
router.delete("/assignments/:id", authenticate, deleteTeacherAssignment);
router.get("/submissions", authenticate, getTeacherSubmissions);
router.patch(
  "/submissions/:submissionId/grade",
  authenticate,
  gradeTeacherSubmission,
);
router.get("/institute/all", authenticate, getInstituteTeachers);
router.get("/", authenticate, getInstituteTeachers);
router.post("/", authenticate, upload.single("teacherPhoto"), createTeacher);

export default router;
