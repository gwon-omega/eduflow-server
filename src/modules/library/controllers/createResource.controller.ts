import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const createResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    const userId = req.user?.id;
    if (!instituteId || !userId) {
      return res.status(401).json({ success: false, message: "Authentication required or institute context missing" });
    }

    const resource = await libraryService.createResource(instituteId, userId, req.body, req.file);
    res.status(201).json({ success: true, data: resource });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to create library resource" });
  }
};
