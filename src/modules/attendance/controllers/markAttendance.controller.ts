import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import attendanceService from "../services/attendance.service";
import notificationService from "../../notification/services/notification.service";
import prisma from "../../../core/database/prisma";

export const markAttendance = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId, courseId, date, status, remarks } = req.body;
    const markedBy = req.user?.id;
    const instituteId = req.instituteId;

    if (!markedBy || !instituteId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!studentId || !courseId || !date || !status) {
      return res.status(400).json({ success: false, message: "Missing required attendance data" });
    }

    const attendance = await attendanceService.markAttendance({
      studentId,
      courseId,
      instituteId,
      date: new Date(date),
      status,
      remarks,
      markedBy,
    });

    // Send notifications for absence
    if (status === "absent") {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (student?.userId) {
        // Trigger multi-channel notifications via service
        await notificationService.createNotification({
          userId: student.userId,
          type: "warning",
          title: "Attendance Alert",
          message: `You were marked ABSENT for ${(attendance as any).course.name} on ${new Date(date).toLocaleDateString()}.`,
          category: "attendance",
          metadata: { status: "absent", courseId }
        });
      }
    }

    res.status(201).json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to mark attendance" });
  }
};
