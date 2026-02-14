import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";
import prisma from "../../../core/database/prisma";

export const getStudentActivity = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const student = await studentRepo.findByUserId(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    // Fetching last 14 days to compare Week vs Week
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activity = await prisma.studentProgress.findMany({
      where: {
        studentId: student.id,
        updatedAt: { gte: fourteenDaysAgo }
      },
      select: {
        timeSpent: true,
        updatedAt: true
      }
    });

    // Comparative Analysis
    const currentWeekTotal = activity
      .filter(a => a.updatedAt >= sevenDaysAgo)
      .reduce((sum, a) => sum + a.timeSpent, 0);

    const previousWeekTotal = activity
      .filter(a => a.updatedAt < sevenDaysAgo)
      .reduce((sum, a) => sum + a.timeSpent, 0);

    const growth = previousWeekTotal > 0
      ? Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)
      : 0;

    // Simple grouping by day for the chart (last 7 days)
    const grouped = activity
      .filter(a => a.updatedAt >= sevenDaysAgo)
      .reduce((acc: any, curr: any) => {
        const day = curr.updatedAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + curr.timeSpent;
        return acc;
    }, {});

    const chartData = Object.keys(grouped).map(day => ({
        day,
        minutes: Math.round(grouped[day] / 60)
    }));

    res.json({
      success: true,
      data: {
        chartData,
        recap: {
          currentWeekTotal: Math.round(currentWeekTotal / 60),
          previousWeekTotal: Math.round(previousWeekTotal / 60),
          growth,
          status: growth >= 0 ? "increased" : "decreased"
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch student activity" });
  }
};
