import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import attendanceService from "../services/attendance.service";

export const markAttendance = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId, courseId, date, status, remarks } = req.body;
    const markedBy = req.user?.id;
    const instituteId = req.instituteId;

    if (!markedBy || !instituteId) throw new Error("Unauthorized");

    const attendance = await attendanceService.markAttendance({
      studentId,
      courseId,
      instituteId,
      date: new Date(date),
      status,
      remarks,
      markedBy,
    });

    res.status(200).json({ status: "success", data: attendance });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
