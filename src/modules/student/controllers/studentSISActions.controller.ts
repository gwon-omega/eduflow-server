import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";
import prisma from "../../../core/database/prisma";

/**
 * Enroll student in a course
 */
export const enrollInCourse = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Course ID is required" });
    }

    const enrollment = await prisma.studentCourse.create({
      data: {
          studentId: student.id,
          courseId,
          instituteId: req.instituteId as string
      }
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error: any) {
    // Handle uniqueness constraint (P2002) for duplicate enrollment
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: "Student is already enrolled in this course" });
    }
    res.status(500).json({ success: false, message: error.message || "An unexpected error occurred during enrollment" });
  }
};

/**
 * Get detailed GPA data for student
 */
export const getStudentGPA = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const { terminalId } = req.params;
    const stats = await studentRepo.getStudentStats(student.id, terminalId);

    res.json({ success: true, data: { gpa: stats.gpa } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to calculate GPA" });
  }
};
