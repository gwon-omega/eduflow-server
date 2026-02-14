import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const getStudentHistory = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) {
       return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const history = await libraryService.getStudentHistory(studentId, instituteId);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student library history" });
  }
};
