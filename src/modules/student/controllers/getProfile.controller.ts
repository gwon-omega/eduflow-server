import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const getProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const profile = await studentService.getStudentProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student profile" });
  }
};
