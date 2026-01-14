import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const getTeacherStudents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user!;
    const teacher = await teacherRepo.findByUserId(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const students = await teacherRepo.getStudents(teacher.id);

    // Format list for frontend
    const formattedStudents = students.map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      courses: s.courses,
      avgGrade: 0, // Placeholder
      progress: 0, // Placeholder
      trend: "stable", // Placeholder
      lastActive: "Now", // Placeholder
      avatar: s.user?.profileImage
    }));

    res.json(formattedStudents);
  } catch (error) {
    next(error);
  }
};
