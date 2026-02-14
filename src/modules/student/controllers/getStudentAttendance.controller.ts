import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";
import attendanceRepo from "../../attendance/repository/attendance.repo";

export const getStudentAttendance = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.instituteId;
    if (!userId || !instituteId) {
       return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const attendance = await attendanceRepo.getAttendance({
        studentId: student.id,
        instituteId
    });

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student attendance" });
  }
};
