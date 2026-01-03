import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import attendanceService from "../services/attendance.service";

export const getAttendance = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.query;
    const instituteId = req.instituteId;

    if (!instituteId) throw new Error("Institute not found");

    const attendance = await attendanceService.getAttendance({
      studentId: studentId as string,
      courseId: courseId as string,
      instituteId,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ status: "success", data: attendance });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
