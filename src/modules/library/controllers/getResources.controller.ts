import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const getResources = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
       return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const resources = await libraryService.getResources(instituteId, req.query);
    res.json({ success: true, data: resources });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch library resources" });
  }
};
