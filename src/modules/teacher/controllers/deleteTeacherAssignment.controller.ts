import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const deleteTeacherAssignment = async (
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

    const { id: assignmentId } = req.params;
    await teacherRepo.deleteAssignment(teacher.id, assignmentId);

    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error: any) {
    if (error.message === "Assignment not found or not owned by this teacher") {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};
