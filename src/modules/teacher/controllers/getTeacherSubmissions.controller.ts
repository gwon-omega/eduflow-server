import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const getTeacherSubmissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.user!;
    const teacher = await teacherRepo.findByUserId(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const submissions = await teacherRepo.getTeacherSubmissions(teacher.id);
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};
