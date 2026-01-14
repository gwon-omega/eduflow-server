import { BaseRepository } from "@core/repository/BaseRepository";
import { Teacher } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class TeacherRepo extends BaseRepository<Teacher> {
  constructor() {
    super("teacher");
  }

  async findByEmail(email: string, instituteId: string): Promise<Teacher | null> {
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
      where: { userId },
      include: {
        institute: true,
      },
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
              }
            }
          }
        }
      }
    });
  }

  async getTeacherStats(teacherId: string) {
    const activeCourses = await prisma.teacherCourse.count({
      where: { teacherId }
    });

    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      select: { courseId: true }
    });

    const courseIds = teacherCourses.map(tc => tc.courseId);

    const totalStudents = await prisma.studentCourse.count({
      where: {
        courseId: { in: courseIds }
      }
    });

    // Pending assignments for courses this teacher teaches
    const pendingGrading = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          courseId: { in: courseIds }
        },
        status: "pending"
      }
    });

    return {
      activeCourses,
      totalStudents,
      pendingGrading,
      classesToday: 0 // Placeholder
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
                        profileImage: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Flatten and unique students
    const studentMap = new Map();
    teacherCourses.forEach(tc => {
      tc.course.students.forEach(sc => {
        if (!studentMap.has(sc.studentId)) {
          studentMap.set(sc.studentId, {
            ...sc.student,
            courses: 1
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
      select: { courseId: true }
    });
    const courseIds = teacherCourses.map(tc => tc.courseId);

    return prisma.scheduleEvent.findMany({
      where: {
        OR: [
          { teacherId },
          { courseId: { in: courseIds } }
        ]
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async getAssignments(teacherId: string) {
    const teacherCourses = await prisma.teacherCourse.findMany({
      where: { teacherId },
      select: { courseId: true }
    });
    const courseIds = teacherCourses.map(tc => tc.courseId);

    return prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      include: {
        _count: {
          select: { submissions: true }
        },
        course: {
          select: { name: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }
}

export default new TeacherRepo();
