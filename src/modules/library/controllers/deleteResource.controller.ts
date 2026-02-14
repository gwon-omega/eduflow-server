import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const deleteResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) {
       return res.status(401).json({ success: false, message: "Institute context required" });
    }

    await libraryService.deleteResource(id, instituteId);
    res.json({ success: true, message: "Resource deleted successfully" });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message || "Failed to delete resource" });
  }
};
