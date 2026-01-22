import prisma from "../../../core/database/prisma";

export class AnalyticsRepo {
  async getAttendanceStats(instituteId: string) {
    // Attendance counts by status
    const statusDistribution = await prisma.attendance.groupBy({
      by: ['status'],
      where: { instituteId },
      _count: true,
    });

    // Recent trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTrends = await prisma.attendance.groupBy({
      by: ['date'],
      where: {
        instituteId,
        date: { gte: sevenDaysAgo },
      },
      _count: {
        status: true,
      },
    });

    return { statusDistribution, recentTrends };
  }

  async getAssessmentPerformance(courseId: string) {
    const performance = await prisma.assessment.findMany({
      where: { courseId },
      include: {
        results: {
          select: {
            marks: true,
          }
        },
        _count: {
          select: {
            results: true,
          }
        }
      }
    });

    return (performance as any[]).map(a => ({
      title: a.title,
      averageMarks: a.results.reduce((acc: number, r: any) => acc + (Number(r.marks) || 0), 0) / (a._count.results || 1),
      maxMarks: a.maxMarks,
      studentsGraded: a._count.results,
    }));
  }

  async getPlatformStats() {
    const totalInstitutes = await prisma.institute.count();
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();

    // Monthly institute growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const instituteGrowth = await prisma.institute.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    // Monthly revenue history (last 6 months)
    const revenueHistory = await prisma.feePayment.groupBy({
      by: ['paymentDate'],
      where: {
        paymentDate: { gte: sixMonthsAgo },
      },
      _sum: {
        amountPaid: true,
      },
    });

    const totalRevenueSum = await prisma.feePayment.aggregate({
      _sum: {
        amountPaid: true,
      }
    });

    // Recent Institutes
    const recentInstitutes = await prisma.institute.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        instituteName: true,
        subdomain: true,
        createdAt: true,
        subscriptionTier: true,
        _count: {
          select: { students: true }
        }
      }
    });

    return {
      totalInstitutes,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalRevenue: Number(totalRevenueSum._sum.amountPaid || 0),
      instituteGrowth,
      revenueHistory,
      recentInstitutes,
      distribution: {
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalUsers - totalStudents - totalTeachers
      }
    };
  }
}

export default new AnalyticsRepo();
