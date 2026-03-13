import studentRepo from "../../student/repository/student.repo";
import teacherRepo from "../../teacher/repository/teacher.repo";
import courseRepo from "../../course/repository/course.repo";
import attendanceRepo from "../../attendance/repository/attendance.repo";
import academicRepo from "../../academic/repository/academic.repo";
import scheduleRepo from "../../academic/repository/schedule.repo";
import prisma from "../../../core/database/prisma";

export class DashboardService {
  async getInstituteOverview(instituteId: string) {
    const [
      students,
      teachers,
      courses,
      recentAttendance,
      upcomingEvents,
      recentResults,
    ] = await Promise.all([
      studentRepo.findAll({ instituteId }),
      teacherRepo.findAll({ instituteId }),
      courseRepo.findAll({ instituteId }),
      attendanceRepo.getAttendance({ instituteId }),
      scheduleRepo.getUpcomingEvents(instituteId, 5),
      academicRepo.getRecentResults(instituteId, 10),
    ]);

    // Aggregate recent activity
    const activities = this.formatActivities(
      recentAttendance,
      students,
      courses,
      recentResults,
    );

    const [courseAnalytics, topPerformers, progressEntries] = await Promise.all(
      [
        prisma.course.findMany({
          where: { instituteId, deletedAt: null },
          include: {
            students: true,
            assessments: {
              include: {
                results: true,
              },
            },
          },
        }),
        prisma.student.findMany({
          where: { instituteId, deletedAt: null },
          include: {
            assessments: {
              include: {
                assessment: {
                  select: {
                    maxMarks: true,
                  },
                },
              },
            },
          },
        }),
        prisma.studentProgress.findMany({
          where: {
            student: {
              instituteId,
            },
          },
          select: {
            progress: true,
            course: {
              select: {
                level: true,
              },
            },
          },
        }),
      ],
    );

    const performanceByCourse = courseAnalytics.map((course) => {
      const allResults = course.assessments.flatMap((assessment) =>
        assessment.results.map((result) => ({
          marks: Number(result.marks || 0),
          maxMarks: Number(assessment.maxMarks || 0),
        })),
      );

      const averagePercent =
        allResults.length > 0
          ? allResults.reduce(
              (sum, result) =>
                sum +
                (result.maxMarks ? (result.marks / result.maxMarks) * 100 : 0),
              0,
            ) / allResults.length
          : 0;

      const passRate =
        allResults.length > 0
          ? (allResults.filter(
              (result) =>
                result.maxMarks && result.marks / result.maxMarks >= 0.4,
            ).length /
              allResults.length) *
            100
          : 0;

      return {
        subject: course.name,
        avgGrade: Math.round(averagePercent),
        passRate: Math.round(passRate),
        students: course.students.length,
      };
    });

    const performerStats = topPerformers
      .map((student) => {
        const percentages = student.assessments
          .filter((result) => Number(result.assessment.maxMarks || 0) > 0)
          .map(
            (result) =>
              (Number(result.marks || 0) /
                Number(result.assessment.maxMarks || 1)) *
              100,
          );

        const averagePercent = percentages.length
          ? percentages.reduce((sum, value) => sum + value, 0) /
            percentages.length
          : 0;
        const gpa = Number((averagePercent / 25).toFixed(2));

        return {
          name: `${student.firstName} ${student.lastName}`,
          gpa,
          grade: this.getLetterGrade(averagePercent),
        };
      })
      .filter((student) => student.gpa > 0)
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 5);

    const attendanceByLevelMap = new Map<
      string,
      { total: number; present: number }
    >();
    recentAttendance.forEach((entry: any) => {
      const level = entry.course?.level || "Unknown";
      const current = attendanceByLevelMap.get(level) || {
        total: 0,
        present: 0,
      };
      current.total += 1;
      if (entry.status === "present" || entry.status === "late") {
        current.present += 1;
      }
      attendanceByLevelMap.set(level, current);
    });

    const attendanceByLevel = Array.from(attendanceByLevelMap.entries()).map(
      ([level, value]) => ({
        grade: level,
        rate: value.total ? Math.round((value.present / value.total) * 100) : 0,
      }),
    );

    const avgGpa = performerStats.length
      ? Number(
          (
            performerStats.reduce((sum, student) => sum + student.gpa, 0) /
            performerStats.length
          ).toFixed(2),
        )
      : 0;
    const courseCompletionRate = progressEntries.length
      ? Math.round(
          progressEntries.reduce((sum, entry) => sum + entry.progress, 0) /
            progressEntries.length,
        )
      : 0;

    return {
      stats: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        activeCourses: courses.length,
        attendanceRate: this.calculateAttendanceRate(recentAttendance),
        avgGpa,
        courseCompletionRate,
      },
      analytics: {
        performanceByCourse,
        topPerformers: performerStats,
        attendanceByLevel,
      },
      activities: activities.slice(0, 10),
      events: upcomingEvents,
    };
  }

  private getLetterGrade(percent: number) {
    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B+";
    if (percent >= 60) return "B";
    if (percent >= 50) return "C";
    return "D";
  }

  private formatActivities(
    attendance: any[],
    students: any[],
    courses: any[],
    results: any[],
  ) {
    const activities: any[] = [];

    // Attendance activities
    attendance.forEach((a: any) => {
      activities.push({
        id: `att-${a.id}`,
        user: {
          name: `${a.student.firstName} ${a.student.lastName}`,
          initials:
            (a.student.firstName[0] || "") + (a.student.lastName[0] || ""),
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
        user: {
          name: `${s.firstName} ${s.lastName}`,
          initials: (s.firstName[0] || "") + (s.lastName[0] || ""),
        },
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
        user: {
          name: `${r.student.firstName} ${r.student.lastName}`,
          initials:
            (r.student.firstName[0] || "") + (r.student.lastName[0] || ""),
        },
        action: "received grade in",
        target: r.assessment.title,
        timestamp: r.submittedAt,
        type: "primary",
      });
    });

    // Sort by timestamp desc
    return activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  private calculateAttendanceRate(attendance: any[]) {
    if (attendance.length === 0) return 0;
    const present = attendance.filter((a) => a.status === "present").length;
    return Math.round((present / attendance.length) * 100);
  }
}

export default new DashboardService();
