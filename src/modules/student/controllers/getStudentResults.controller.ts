import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import studentRepo from "../repository/student.repo";

export const getStudentResults = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user!;
    if (!id) {
       return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const results = await studentRepo.getResults(student.id);

    const formatted = results.map((r: any) => ({
      id: r.id,
      title: r.assessment.title,
      courseName: r.assessment.course?.name || "Unknown Course",
      marks: r.marks,
      maxMarks: r.assessment.maxMarks,
      percentage: r.assessment.maxMarks > 0 ? (r.marks / r.assessment.maxMarks) * 100 : 0,
      submittedAt: r.submittedAt,
      remarks: r.remarks
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student results" });
  }
};
