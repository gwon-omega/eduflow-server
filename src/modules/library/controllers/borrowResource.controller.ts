import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const borrowResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.instituteId;
    if (!userId || !instituteId) {
       return res.status(401).json({ success: false, message: "Authentication required or institute context missing" });
    }

    const { resourceId, days } = req.body;
    if (!resourceId) {
       return res.status(400).json({ success: false, message: "Resource ID required" });
    }

    const borrow = await libraryService.borrowResource(userId, instituteId, resourceId, days);
    res.status(201).json({ success: true, data: borrow });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to borrow resource" });
  }
};
