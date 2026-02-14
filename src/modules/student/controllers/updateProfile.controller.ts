import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const updateProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { id } = req.params;
    const updated = await studentService.updateStudent(id, req.body, req.file);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update profile" });
  }
};
