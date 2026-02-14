import academicRepo from "../repository/academic.repo";
import { getGradeFromPercentage, calculateGPA } from "../utils/grading.utils";
import prisma from "../../../core/database/prisma";
import pushService from "../../notification/services/push.service";
import academicIntegrityService from "./academic-integrity.service";

export class AcademicService {
  async createAssessment(data: any) {
    return academicRepo.create(data);
  }

  async getAssessments(courseId: string) {
    return academicRepo.getAssessments(courseId);
  }

  async submitResult(data: any) {
    // Generate cryptographic verification hash to prevent tampering
    const verificationHash = academicIntegrityService.generateResultHash(
      data.studentId,
      data.assessmentId,
      data.marks
    );

    const result = await academicRepo.submitResult({
      ...data,
      verificationHash
    });

    // Fetch student user ID for notification
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: true }
    });

    if (student?.userId) {
      await pushService.sendNotification(student.userId, {
        title: "New Grade Posted",
        body: `Your result for the assessment has been posted. Grade/Marks: ${data.marks}`,
        data: { type: "academic", assessmentId: data.assessmentId }
      });
    }

    return result;
  }

  async getResults(assessmentId: string) {
    return academicRepo.getResults(assessmentId);
  }

  async getStudentGPA(studentId: string, terminalId: string) {
    const results = await academicRepo.getResultsByStudentTerminal(studentId, terminalId);
    if (!results || results.length === 0) return { gpa: 0, status: "No Results" };

    const subjectGPAs = results.map((r: any) => {
      const percentage = (r.obtainedMarks / r.totalMarks) * 100;
      return getGradeFromPercentage(percentage).gpa;
    });

    const gpa = calculateGPA(subjectGPAs);
    return {
      gpa,
      status: gpa === 0 ? "NG" : "Graded",
      subjectCount: results.length
    };
  }
}

export default new AcademicService();
