import attendanceRepo from "../repository/attendance.repo";

export class AttendanceService {
  async markAttendance(data: any) {
    return attendanceRepo.markAttendance(data);
  }

  async getAttendance(filters: any) {
    return attendanceRepo.getAttendance(filters);
  }
}

export default new AttendanceService();
