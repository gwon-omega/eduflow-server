import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";
import prisma from "../../../core/database/prisma";

export const getStudentCourseProgress = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const progress = await (prisma.studentProgress as any).findMany({
      where: { studentId: student.id },
      include: {
          course: { select: { name: true, thumbnail: true } }
      }
    });

    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch course progress" });
  }
};
