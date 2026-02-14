import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";
import prisma from "../../../core/database/prisma";

export const getStudentDeadlines = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const studentCourses = await prisma.studentCourse.findMany({
      where: { studentId: student.id },
      select: { courseId: true }
    });
    const courseIds = studentCourses.map(sc => sc.courseId);

    const deadlines = await prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
        dueDate: { gte: new Date() },
        submissions: {
          none: { studentId: student.id }
        }
      },
      include: {
        course: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    res.json({ success: true, data: deadlines });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student deadlines" });
  }
};
