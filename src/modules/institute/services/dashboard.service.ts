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
      upcomingEvents,
      recentResults
    ] = await Promise.all([
      studentRepo.findAll({ instituteId }),
      teacherRepo.findAll({ instituteId }),
      courseRepo.findAll({ instituteId }),
      attendanceRepo.getAttendance({ instituteId }),
      scheduleRepo.getUpcomingEvents(instituteId, 5),
      academicRepo.getRecentResults(instituteId, 10)
    ]);

    // Aggregate recent activity
    const activities = this.formatActivities(recentAttendance, students, courses, recentResults);

    return {
      stats: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        activeCourses: courses.length,
        attendanceRate: this.calculateAttendanceRate(recentAttendance)
      },
      activities: activities.slice(0, 10),
      events: upcomingEvents
    };
  }

  private formatActivities(attendance: any[], students: any[], courses: any[], results: any[]) {
    const activities: any[] = [];

    // Attendance activities
    attendance.forEach((a: any) => {
      activities.push({
        id: `att-${a.id}`,
        user: {
          name: `${a.student.firstName} ${a.student.lastName}`,
          initials: (a.student.firstName[0] || "") + (a.student.lastName[0] || "")
        },
        action: "marked as",
        target: a.status,
        timestamp: a.date,
        type: a.status === "present" ? "success" : "warning",
      });
    });

    // Student enrollment activities
    students.slice(-10).forEach((s: any) => {
      activities.push({
        id: `stu-${s.id}`,
        user: { name: `${s.firstName} ${s.lastName}`, initials: (s.firstName[0] || "") + (s.lastName[0] || "") },
        action: "joined as a",
        target: "new student",
        timestamp: s.createdAt,
        type: "info",
      });
    });

    // Course creation activities
    courses.slice(-10).forEach((c: any) => {
      activities.push({
        id: `crs-${c.id}`,
        user: { name: "Institute", initials: "IN" },
        action: "launched new course:",
        target: c.name,
        timestamp: c.createdAt,
        type: "success",
      });
    });

    // Result posting activities
    results.forEach((r: any) => {
      activities.push({
        id: `res-${r.id}`,
        user: { name: `${r.student.firstName} ${r.student.lastName}`, initials: (r.student.firstName[0] || "") + (r.student.lastName[0] || "") },
        action: "received grade in",
        target: r.assessment.title,
        timestamp: r.submittedAt,
        type: "primary",
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
