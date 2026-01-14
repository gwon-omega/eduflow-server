import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const getTeacherAssignments = async (
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

    const assignments = await teacherRepo.getAssignments(teacher.id);

    // Format
    const formattedAssignments = assignments.map((a: any) => ({
      id: a.id,
      title: a.title,
      course: a.course.name,
      type: "assignment", // Default type
      dueDate: new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: new Date(a.dueDate) > new Date() ? "active" : "completed",
      submissions: a._count.submissions,
      totalStudents: 0, // Need to get course student count properly
      avgScore: null
    }));

    res.json(formattedAssignments);
  } catch (error) {
    next(error);
  }
};
