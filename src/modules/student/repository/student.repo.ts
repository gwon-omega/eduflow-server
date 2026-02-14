import { TenantRepository } from "@core/repository/TenantRepository";
import { Student } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class StudentRepo extends TenantRepository<Student> {
  constructor() {
    super("student");
  }

  async findByUserId(userId: string): Promise<Student | null> {
    // userId is not unique in Student (a user can be a student in many institutes)
    // We use findFirst to get the most recent or primary entry
    return this.model.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { enrolledDate: 'desc' }
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

  async getStudentStats(studentId: string, terminalId?: string) {
    const enrolledCourses = await prisma.studentCourse.count({
      where: { studentId }
    });

    // Calculate GPA from assessment results
    const results = await prisma.assessmentResult.findMany({
      where: {
        studentId,
        ...(terminalId ? { assessment: { terminalId } } : {})
      } as any,
      include: {
        assessment: true
      }
    });

    let gpa = 0;
    if (results.length > 0) {
      const totalPoints = results.reduce((acc, curr: any) => {
        const percentage = (curr.marks / curr.assessment.maxMarks) * 100;
        // Simple 4.0 scale conversion: percentage / 25
        return acc + (percentage / 25);
      }, 0);
      gpa = parseFloat((totalPoints / results.length).toFixed(2));
    }

    // Aggregate learning hours from progress tracking
    const progress = await prisma.studentProgress.aggregate({
      where: { studentId },
      _sum: {
        timeSpent: true
      }
    });
    // duration is in seconds now based on schema (updated to timeSpent)
    const learningHours = Math.round((progress._sum.timeSpent || 0) / 3600);

    const pendingAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId,
        status: "pending"
      }
    });

    // Assignments due within next 48 hours
    const fortyEightHoursFromNow = new Date();
    fortyEightHoursFromNow.setHours(fortyEightHoursFromNow.getHours() + 48);

    const urgentAssignments = await prisma.assignment.count({
      where: {
        course: {
          students: {
            some: { studentId }
          }
        },
        dueDate: {
          gt: new Date(),
          lte: fortyEightHoursFromNow
        },
        submissions: {
          none: { studentId }
        },
        deletedAt: null
      }
    });

    return {
      enrolledCourses,
      learningHours,
      gpa,
      pendingAssignments,
      urgentAssignments
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
