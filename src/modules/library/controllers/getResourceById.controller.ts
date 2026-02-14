import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const getResourceById = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const resource = await libraryService.getResourceById(id, instituteId);
    if (!resource) {
       return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, data: resource });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch resource details" });
  }
};
