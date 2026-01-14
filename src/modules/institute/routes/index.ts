import { Router } from "express";
import { createInstitute } from "../controllers/createInstitute.controller";
import { getMyInstitutes } from "../controllers/getMyInstitutes.controller";
import { updateSubdomain } from "../controllers/updateSubdomain.controller";
import { getInstituteBySlug } from "../controllers/getInstituteBySlug.controller";
import {
  getPublicInstitutes,
  requestJoinInstitute,
  getMyJoinRequests,
  getInstituteJoinRequests,
  reviewJoinRequest,
} from "../controllers/joinRequest.controller";
import { authenticate } from "../../../core/middleware/authenticate";
import { registrationLimiter } from "../../../core/middleware/rateLimiter";

const router = Router();

// Public routes
router.get("/public", getPublicInstitutes);
router.get("/slug/:slug", getInstituteBySlug);

// Authenticated routes
router.post("/", authenticate, registrationLimiter, createInstitute);
router.get("/my", authenticate, getMyInstitutes);
router.post("/:id/subdomain", authenticate, updateSubdomain);

// Join request routes
router.get("/my-requests", authenticate, getMyJoinRequests);
router.post("/:id/join", authenticate, requestJoinInstitute);
router.get("/:id/requests", authenticate, getInstituteJoinRequests);
router.patch("/requests/:id", authenticate, reviewJoinRequest);

export default router;
