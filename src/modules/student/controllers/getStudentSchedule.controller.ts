import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";
import teacherRepo from "../../teacher/repository/teacher.repo";

export const getStudentSchedule = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    // Reusing the broad schedule logic from teacherRepo but for courses student is enrolled in
    const enrolledCourses = await studentRepo.getEnrolledCourses(student.id);
    const courseIds = enrolledCourses.map((ec: any) => ec.courseId);

    const schedule = await teacherRepo.findMany({
      where: {
        OR: [
          { courseId: { in: courseIds } },
          { attendees: { some: { userId } } }
        ]
      },
      orderBy: { startTime: 'asc' }
    });

    res.json({ success: true, data: schedule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student schedule" });
  }
};
