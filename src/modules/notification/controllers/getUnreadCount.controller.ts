import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import notificationService from "../services/notification.service";

export const getUnreadCount = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch unread count" });
  }
};
