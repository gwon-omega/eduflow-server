import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { markAttendance, getAttendance } from "../controllers";

const router = Router();

router.get("/", authenticate, getAttendance);
router.post("/mark", authenticate, markAttendance);

export default router;
