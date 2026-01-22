import studentRepo from "../../student/repository/student.repo";
import teacherRepo from "../../teacher/repository/teacher.repo";
import courseRepo from "../../course/repository/course.repo";
import attendanceRepo from "../../attendance/repository/attendance.repo";
import academicRepo from "../../academic/repository/academic.repo";
import scheduleRepo from "../../academic/repository/schedule.repo";

export class DashboardService {
  async getInstituteOverview(instituteId: string) {
    const [
      students,
      teachers,
      courses,
      recentAttendance,
      upcomingEvents
    ] = await Promise.all([
      studentRepo.findAll({ instituteId }),
      teacherRepo.findAll({ instituteId }),
      courseRepo.findAll({ instituteId }),
      attendanceRepo.getAttendance({ instituteId }),
      scheduleRepo.getUpcomingEvents(instituteId, 5)
    ]);

    // Aggregate recent activity
    const activities = this.formatActivities(recentAttendance, students);

    return {
      stats: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        activeCourses: courses.length,
        attendanceRate: this.calculateAttendanceRate(recentAttendance)
      },
      activities: activities.slice(0, 5),
      events: upcomingEvents
    };
  }

  private formatActivities(attendance: any[], students: any[]) {
    // Combine different activity types and sort by date
    const activities: any[] = [];

    attendance.forEach((a: any) => {
      activities.push({
        id: `att-${a.id}`,
        user: { name: `${a.student.firstName} ${a.student.lastName}`, initials: a.student.firstName[0] + a.student.lastName[0] },
        action: "marked as",
        target: a.status,
        timestamp: a.date,
        type: a.status === "present" ? "success" : "warning",
      });
    });

    // Sort by timestamp desc
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private calculateAttendanceRate(attendance: any[]) {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === "present").length;
    return Math.round((present / attendance.length) * 100);
  }
}

export default new DashboardService();
