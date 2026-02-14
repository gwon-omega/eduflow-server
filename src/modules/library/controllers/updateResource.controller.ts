import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const updateResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) {
       return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const updated = await libraryService.updateResource(id, instituteId, req.body, req.file);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to update resource" });
  }
};
