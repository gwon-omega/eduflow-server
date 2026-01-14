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
}

export default new TeacherRepo();
