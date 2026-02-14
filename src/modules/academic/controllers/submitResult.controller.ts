import { Request, Response } from "express";
import academicService from "../services/academic.service";

export const submitResult = async (req: Request, res: Response) => {
  try {
    const instituteId = (req as any).instituteId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const result = await academicService.submitResult({
      ...req.body,
      instituteId,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to submit result" });
  }
};
