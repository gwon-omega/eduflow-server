import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const gradeTeacherSubmission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userId } = req.user!;
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (typeof grade !== "number" || grade < 0 || grade > 100) {
      return res
        .status(400)
        .json({ message: "Grade must be a number between 0 and 100" });
    }

    const teacher = await teacherRepo.findByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const updated = await teacherRepo.gradeSubmission(
      submissionId,
      grade,
      feedback ?? "",
      teacher.id,
    );

    res.json({ success: true, submission: updated });
  } catch (error) {
    next(error);
  }
};
