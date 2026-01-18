import { BaseRepository } from "@core/repository/BaseRepository";
import { Assessment, AssessmentResult } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class AcademicRepo extends BaseRepository<Assessment> {
  constructor() {
    super("assessment");
  }

  async getAssessments(courseId: string) {
    return this.model.findMany({
      where: { courseId },
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

  async getResultsByStudentTerminal(studentId: string, terminalId: string) {
    // Note: 'terminalId' is currently treated as a placeholder for filtering a set of assessments.
    // In a future update, we will add a 'Terminal' model to the schema.
    return (prisma as any).assessmentResult.findMany({
      where: {
        studentId,
      },
      include: {
        assessment: true,
      },
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
