import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";

export const getStudentStats = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const student = await studentRepo.findByUserId(userId);
    if (!student) throw new Error("Student profile not found");

    const stats = await studentRepo.getStudentStats(student.id);

    res.json({ status: "success", data: stats });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
