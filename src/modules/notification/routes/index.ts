import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getNotifications } from "../controllers/getNotifications.controller";
import { markAsRead } from "../controllers/markAsRead.controller";
import { getUnreadCount } from "../controllers/getUnreadCount.controller";

const router = Router();

router.get("/", authenticate, getNotifications);
router.post("/read", authenticate, markAsRead);
router.get("/unread-count", authenticate, getUnreadCount);

// Support single-notification PUT /notification/:id/read format used by frontend
router.put("/:id/read", authenticate, async (req: any, res: any) => {
  req.body = { ids: [req.params.id] };
  return markAsRead(req, res);
});

export default router;
