import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import studentRepo from "../repository/student.repo";

export const getStudentAssignments = async (
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

    const assignments = await studentRepo.getAssignments(student.id);

    const formatted = assignments.map((a: any) => {
      const submission = a.submissions[0]; // Assuming one submission per student per assignment
      let status = "pending";
      if (submission) status = submission.status;
      else if (new Date(a.dueDate) < new Date()) status = "overdue";

      return {
        id: a.id,
        title: a.title,
        course: a.course.name,
        dueDate: new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status,
        type: "assignment"
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student assignments" });
  }
};
