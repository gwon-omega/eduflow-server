import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import attendanceService from "../services/attendance.service";

export const getAttendance = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.query;
    const instituteId = req.instituteId;

    if (!instituteId) {
      return res.status(401).json({ success: false, message: "Institute context required" });
    }

    const attendance = await attendanceService.getAttendance({
      studentId: studentId as string,
      courseId: courseId as string,
      instituteId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch attendance data" });
  }
};
