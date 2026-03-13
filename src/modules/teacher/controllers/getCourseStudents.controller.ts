import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const getCourseStudents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.user!;
    const { courseId } = req.params;

    const teacher = await teacherRepo.findByUserId(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const enrollments = await teacherRepo.getCourseStudents(
      teacher.id,
      courseId,
    );

    res.json(
      enrollments.map((enrollment, index) => ({
        id: enrollment.student.id,
        name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        email: enrollment.student.email,
        rollNo: `${String(index + 1).padStart(3, "0")}`,
      })),
    );
  } catch (error) {
    next(error);
  }
};
