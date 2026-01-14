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
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/profile", authenticate, getProfile);
router.get("/", authenticate, getStudents);
router.get("/:id", authenticate, getStudentById);
router.post("/", authenticate, upload.single("studentImage"), createStudent);
router.get("/courses/enrolled", authenticate, getEnrolledCourses);
router.get("/stats", authenticate, getStudentStats);
router.get("/assignments", authenticate, getStudentAssignments);
router.get("/results", authenticate, getStudentResults);
router.put("/:id", authenticate, upload.single("studentImage"), updateProfile);
router.delete("/:id", authenticate, deleteStudent);

export default router;
