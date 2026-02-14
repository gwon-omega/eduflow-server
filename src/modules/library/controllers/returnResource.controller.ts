import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const returnResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
       return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const { borrowId } = req.body;
    if (!borrowId) {
       return res.status(400).json({ success: false, message: "Borrow record ID required" });
    }

    await libraryService.returnResource(borrowId, instituteId);
    res.json({ success: true, message: "Resource returned successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to return resource" });
  }
};
