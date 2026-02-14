import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import notificationService from "../services/notification.service";

export const getNotifications = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const notifications = await notificationService.getUserNotifications(userId, req.query);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch notifications" });
  }
};
