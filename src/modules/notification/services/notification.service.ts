import notificationRepo from "../repository/notification.repo";
import { NotificationType } from "@prisma/client";
import pushService from "./push.service";
import prisma from "../../../core/database/prisma";
import socketService from "../../../core/services/socket.service";

export class NotificationService {
  async getUserNotifications(userId: string, filters: any) {
    return notificationRepo.findByUser(userId, filters);
  }

  async markAsRead(userId: string, ids: string[]) {
    if (ids.length === 1 && ids[0] === "all") {
      const unread = await notificationRepo.findByUser(userId, { isRead: false, limit: 1000 });
      const unreadIds = unread.map((n: any) => n.id);
      if (unreadIds.length === 0) return { count: 0 };
      return notificationRepo.markAsRead(unreadIds);
    }
    return notificationRepo.markAsRead(ids);
  }

  async getUnreadCount(userId: string) {
    return notificationRepo.getUnreadCount(userId);
  }

  async createNotification(data: { userId: string; type: NotificationType; title: string; message: string; category?: string; link?: string; metadata?: any }) {
    const notification = await notificationRepo.create(data);

    // Trigger socket notification (Real-time bridge)
    try {
      socketService.emitToUser(data.userId, "notification:new", notification);
    } catch (e) {
      console.error("[Socket] Failed to emit notification:", e);
    }

    // Trigger push notification
    try {
      await pushService.sendNotification(data.userId, {
        title: data.title,
        body: data.message,
        data: {
          category: data.category,
          link: data.link,
          id: notification.id,
          ...data.metadata
        }
      });
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }

    return notification;
  }

  /**
   * Senior-Level Helper: Notify a student specifically
   */
  async notifyStudent(studentId: string, data: { title: string; message: string; type: NotificationType; category?: string; link?: string; metadata?: any }) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student?.userId) return null;

    return this.createNotification({
      userId: student.userId,
      ...data
    });
  }

  /**
   * Senior-Level Helper: Notify an institute owner
   */
  async notifyInstitute(instituteId: string, data: { title: string; message: string; type: NotificationType; category?: string; link?: string; metadata?: any }) {
    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { ownerId: true }
    });

    if (!institute?.ownerId) return null;

    return this.createNotification({
      userId: institute.ownerId,
      ...data
    });
  }
}

export default new NotificationService();
