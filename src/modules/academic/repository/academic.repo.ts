import { TenantRepository } from "@core/repository/TenantRepository";
import { Assessment, AssessmentResult } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class AcademicRepo extends TenantRepository<Assessment> {
  constructor() {
    super("assessment");
  }

  async getAssessments(courseId: string) {
    return this.model.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitResult(data: {
    assessmentId: string;
    studentId: string;
    marks: number;
    remarks?: string;
    instituteId: string;
  }) {
    return (prisma as any).assessmentResult.create({
      data,
    });
  }

  async getResults(assessmentId: string) {
    return (prisma as any).assessmentResult.findMany({
      where: { assessmentId },
      include: {
        student: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { marks: "desc" },
    });
  }

  async getRecentResults(instituteId: string, limit: number = 10) {
    return (prisma as any).assessmentResult.findMany({
      where: {
        assessment: { instituteId }
      },
      include: {
        student: {
          select: { firstName: true, lastName: true }
        },
        assessment: {
          select: { title: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit
    });
  }

  async getResultsByStudentTerminal(studentId: string, terminalId: string) {
    return (prisma as any).assessmentResult.findMany({
      where: {
        studentId,
        assessment: { terminalId }
      },
      include: { assessment: true },
    }).then((results: any[]) =>
      results.map((r) => ({
        ...r,
        obtainedMarks: r.marks,
        totalMarks: r.assessment.maxMarks,
      }))
    );
  }
}

export default new AcademicRepo();
