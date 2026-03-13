import { BaseRepository } from "@core/repository/BaseRepository";
import { Teacher } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class TeacherRepo extends BaseRepository<Teacher> {
  constructor() {
    super("teacher");
  }

  async findByEmail(
    email: string,
    instituteId: string,
  ): Promise<Teacher | null> {
    return this.model.findUnique({
      where: {
        instituteId_email: {
          instituteId,
          email,
        },
      },
      include: {
        user: true,
        institute: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Teacher | null> {
    return this.model.findFirst({
      where: { userId, deletedAt: null },
      include: {
        institute: true,
      },
    });
  }

  async findAllByUserId(userId: string) {
    return this.model.findMany({
      where: { userId, deletedAt: null },
      include: {
        institute: true,
      },
      orderBy: { joinedDate: "desc" },
    });
  }

  async findAllByEmail(email: string) {
    return this.model.findMany({
      where: { email, deletedAt: null },
      include: {
        institute: true,
      },
      orderBy: { joinedDate: "desc" },
    });
  }

  async getAssignedCourses(teacherId: string) {
    return prisma.teacherCourse.findMany({
      where: { teacherId },
      include: {
        course: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });
  }

  async getTeacherStats(teacherId: string) {
    const activeCourses = await prisma.teacherCourse.count({
      where: { teacherId },
    });

    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      select: { courseId: true },
    });

    const courseIds = teacherCourses.map((tc) => tc.courseId);

    const totalStudents = await prisma.studentCourse.count({
      where: {
        courseId: { in: courseIds },
      },
    });

    // Pending assignments for courses this teacher teaches
    const pendingGrading = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          courseId: { in: courseIds },
        },
        status: "pending",
      },
    });

    // Count classes scheduled for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const classesToday = await prisma.scheduleEvent.count({
      where: {
        OR: [{ teacherId }, { courseId: { in: courseIds } }],
        startTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    return {
      activeCourses,
      totalStudents,
      pendingGrading,
      classesToday,
    };
  }

  async getStudents(teacherId: string) {
    // Get all courses taught by this teacher
    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      include: {
        course: {
          select: {
            id: true,
            students: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        email: true,
                        profileImage: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten and unique students
    const studentMap = new Map();
    teacherCourses.forEach((tc) => {
      tc.course.students.forEach((sc) => {
        if (!studentMap.has(sc.studentId)) {
          studentMap.set(sc.studentId, {
            ...sc.student,
            courses: 1,
          });
        } else {
          const s = studentMap.get(sc.studentId);
          s.courses++;
        }
      });
    });

    return Array.from(studentMap.values());
  }

  async getSchedule(teacherId: string) {
    // Get schedule events for this teacher or their courses
    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      select: { courseId: true },
    });
    const courseIds = teacherCourses.map((tc) => tc.courseId);

    return prisma.scheduleEvent.findMany({
      where: {
        OR: [{ teacherId }, { courseId: { in: courseIds } }],
      },
      include: {
        _count: {
          select: { attendees: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async getAssignments(teacherId: string) {
    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      select: { courseId: true },
    });
    const courseIds = teacherCourses.map((tc) => tc.courseId);

    return prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        _count: {
          select: { submissions: true },
        },
        course: {
          select: { name: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  async getCourseStudents(teacherId: string, courseId: string) {
    const teacherCourse = await prisma.teacherCourse.findFirst({
      where: { teacherId, courseId },
      select: { courseId: true },
    });

    if (!teacherCourse) {
      return [];
    }

    return prisma.studentCourse.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        student: {
          firstName: "asc",
        },
      },
    });
  }

  async getTeacherSubmissions(teacherId: string) {
    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      select: { courseId: true },
    });
    const courseIds = teacherCourses.map((tc) => tc.courseId);

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, title: true, course: { select: { name: true } } },
    });
    const assignmentIds = assignments.map((a) => a.id);
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: { in: assignmentIds } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 50,
    });

    return submissions.map((s) => {
      const assignment = assignmentMap.get(s.assignmentId);
      return {
        id: s.id,
        student: `${s.student.firstName} ${s.student.lastName}`,
        studentId: s.student.id,
        assignment: assignment?.title ?? "",
        course: assignment?.course?.name ?? "",
        submittedAt: s.submittedAt,
        status: s.status,
        grade: s.grade,
        feedback: s.feedback,
        gradedAt: s.gradedAt,
        isLate: s.isLate,
      };
    });
  }

  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    gradedBy: string,
  ) {
    return prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback,
        gradedBy,
        gradedAt: new Date(),
        status: "graded" as any,
      },
    });
  }

  async createAssignment(
    teacherId: string,
    instituteId: string,
    data: {
      courseId: string;
      title: string;
      description?: string;
      dueDate: string;
      maxPoints?: number;
      priority?: string;
    },
    userId: string,
  ) {
    // Verify teacher is assigned to this course
    const teacherCourse = await prisma.teacherCourse.findFirst({
      where: { teacherId, courseId: data.courseId },
    });
    if (!teacherCourse) {
      throw new Error("You are not assigned to this course");
    }
    return prisma.assignment.create({
      data: {
        instituteId,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        maxPoints: data.maxPoints ?? 100,
        priority: (data.priority as any) ?? "medium",
        createdBy: userId,
      },
      include: {
        course: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    });
  }

  async deleteAssignment(teacherId: string, assignmentId: string) {
    // Find assignment in teacher's courses
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        course: {
          teachers: { some: { teacherId } },
        },
      },
    });
    if (!assignment) {
      throw new Error("Assignment not found or not owned by this teacher");
    }
    return prisma.assignment.delete({ where: { id: assignmentId } });
  }
}

export default new TeacherRepo();
