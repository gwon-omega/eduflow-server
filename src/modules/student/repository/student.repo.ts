import { BaseRepository } from "@core/repository/BaseRepository";
import { Student } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class StudentRepo extends BaseRepository<Student> {
  constructor() {
    super("student");
  }

  async findByUserId(userId: string): Promise<Student | null> {
    return this.model.findUnique({
      where: { userId },
    });
  }

  async findWithProfile(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        institute: true,
      },
    });
  }

  async getEnrolledCourses(studentId: string) {
    return prisma.studentCourse.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teachers: {
              include: {
                teacher: true
              }
            }
          }
        }
      }
    });
  }

  async getStudentStats(studentId: string) {
    const enrolledCourses = await prisma.studentCourse.count({
      where: { studentId }
    });

    // For learning hours, GPA, etc., we'd need more logic/tables.
    // Simplifying for now with counts.
    const pendingAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId,
        status: "pending"
      }
    });

    return {
      enrolledCourses,
      learningHours: 0, // Placeholder
      gpa: 0, // Placeholder
      pendingAssignments,
      urgentAssignments: 0 // Placeholder
    };
  }

  async getAssignments(studentId: string) {
    // Get courses first
    const studentCourses = await prisma.studentCourse.findMany({
      where: { studentId },
      select: { courseId: true }
    });
    const courseIds = studentCourses.map(sc => sc.courseId);

    return prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      include: {
        course: {
          select: { name: true }
        },
        submissions: {
          where: { studentId }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async getResults(studentId: string) {
    return prisma.assessmentResult.findMany({
      where: { studentId },
      include: {
        assessment: {
          select: {
            title: true,
            maxMarks: true,
            course: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
  }
}

export default new StudentRepo();
