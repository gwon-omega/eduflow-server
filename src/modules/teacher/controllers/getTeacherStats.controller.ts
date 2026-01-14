import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import teacherRepo from "../repository/teacher.repo";

export const getTeacherStats = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const teacher = await teacherRepo.findByUserId(userId);
    if (!teacher) throw new Error("Teacher profile not found");

    const stats = await teacherRepo.getTeacherStats(teacher.id);

    res.json({ status: "success", data: stats });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
