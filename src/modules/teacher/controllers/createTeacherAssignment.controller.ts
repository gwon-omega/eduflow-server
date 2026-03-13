import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const createTeacherAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userId } = req.user!;
    const teacher = await teacherRepo.findByUserId(userId);
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    }

    const { courseId, title, description, dueDate, maxPoints, priority } =
      req.body;
    if (!courseId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "courseId, title, and dueDate are required",
      });
    }

    const assignment = await teacherRepo.createAssignment(
      teacher.id,
      teacher.instituteId,
      { courseId, title, description, dueDate, maxPoints, priority },
      userId,
    );

    const formatted = {
      id: assignment.id,
      title: assignment.title,
      course: (assignment as any).course?.name ?? "",
      type: "assignment",
      dueDate: new Date(assignment.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status:
        new Date(assignment.dueDate) > new Date() ? "active" : "completed",
      submissions: (assignment as any)._count?.submissions ?? 0,
      totalStudents: 0,
      avgScore: null,
    };

    res.status(201).json({ success: true, data: formatted });
  } catch (error: any) {
    if (error.message === "You are not assigned to this course") {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};
