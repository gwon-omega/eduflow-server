import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import notificationService from "../services/notification.service";

export const markAsRead = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ids } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: "Notification IDs array required" });
    }

    const result = await notificationService.markAsRead(userId, ids);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to mark notifications as read" });
  }
};
