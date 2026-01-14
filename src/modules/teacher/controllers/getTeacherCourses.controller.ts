import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import teacherRepo from "../repository/teacher.repo";

export const getTeacherCourses = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const teacher = await teacherRepo.findByUserId(userId);
    if (!teacher) throw new Error("Teacher profile not found");

    const courses = await teacherRepo.getAssignedCourses(teacher.id);

    // Map to expected format
    const formattedCourses = courses.map(tc => ({
      id: tc.course.id,
      title: tc.course.name,
      students: tc.course._count.students,
      pendingAssignments: 0, // Should be calculated or fetched separately
      avgProgress: 0, // Calculate from student progress
      nextClass: "TBD",
    }));

    res.json({ status: "success", data: formattedCourses });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
