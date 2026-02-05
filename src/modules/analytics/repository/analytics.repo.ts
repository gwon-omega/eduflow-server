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

    // Subscription tier breakdown
    const subscriptionBreakdown = await prisma.institute.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    });

    const activeSubscriptions = await prisma.institute.count({
      where: { isActive: true, subscriptionTier: { not: 'trial' } }
    });

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

    // Monthly revenue history (last 7 months for chart)
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const revenueHistory = await prisma.feePayment.groupBy({
      by: ['paymentDate'],
      where: {
        paymentDate: { gte: sevenMonthsAgo },
      },
      _sum: {
        amountPaid: true,
      },
    });

    // Aggregate revenue by month for chart
    const monthlyRevenue: Record<string, number> = {};
    for (const entry of revenueHistory) {
      const month = new Date(entry.paymentDate).toLocaleDateString('en-US', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(entry._sum.amountPaid || 0);
    }

    const revenueChartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));

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
        isActive: true,
        _count: {
          select: { students: true }
        }
      }
    });

    // Format recent institutes for frontend
    const formattedRecentInstitutes = recentInstitutes.map(inst => ({
      id: inst.id,
      name: inst.instituteName,
      plan: inst.subscriptionTier,
      students: inst._count.students,
      status: inst.isActive ? 'active' : 'inactive',
      createdAt: inst.createdAt,
    }));

    return {
      totalInstitutes,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalRevenue: Number(totalRevenueSum._sum.amountPaid || 0),
      activeSubscriptions,
      subscriptionBreakdown: subscriptionBreakdown.map(s => ({
        tier: s.subscriptionTier,
        count: s._count,
      })),
      instituteGrowth,
      revenueHistory,
      revenueChartData,
      recentInstitutes: formattedRecentInstitutes,
      distribution: {
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalUsers - totalStudents - totalTeachers
      }
    };
  }
}

export default new AnalyticsRepo();
