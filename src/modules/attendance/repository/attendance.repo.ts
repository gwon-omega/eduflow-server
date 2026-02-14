import { TenantRepository } from "@core/repository/TenantRepository";
import { Attendance } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class AttendanceRepo extends TenantRepository<Attendance> {
  constructor() {
    super("attendance");
  }

  async markAttendance(data: {
    studentId: string;
    courseId: string;
    instituteId: string;
    date: Date;
    status: any;
    markedBy: string;
    remarks?: string;
  }) {
    return this.upsertByTenant({
      where: {
        studentId_courseId_date: {
          studentId: data.studentId,
          courseId: data.courseId,
          date: data.date,
        },
      },
      update: {
        status: data.status,
        remarks: data.remarks,
        markedBy: data.markedBy,
      },
      create: data,
      instituteId: data.instituteId,
      include: {
        course: true,
      }
    });
  }

  async getAttendance(filters: {
    studentId?: string;
    courseId?: string;
    instituteId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { studentId, courseId, instituteId, startDate, endDate } = filters;
    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (courseId) where.courseId = courseId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.findManyByTenant({
      instituteId,
      where,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
    });
  }
}

export default new AttendanceRepo();
