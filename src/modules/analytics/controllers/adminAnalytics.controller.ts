import { Response } from "express";
import prisma from "@core/database/prisma";
import { IExtendedRequest } from "@core/middleware/type";
import os from "os";

/**
 * Get all users for super admin
 * GET /admin/users
 */
export const getAllUsers = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
// ... (rest of getAllUsers)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const role = req.query.role as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "all") {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          accountStatus: true,
          emailVerified: true,
          createdAt: true,
          profileImage: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown",
      email: user.email,
      role: user.role,
      status: user.accountStatus,
      verified: user.emailVerified,
      avatar: user.profileImage,
      joined: user.createdAt,
    }));

    return res.status(200).json({
      users: formattedUsers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get system health metrics
 * GET /admin/health
 */
export const getSystemHealth = async (req: IExtendedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get counts for health metrics
    const [
      totalUsers,
      activeUsers,
      totalInstitutes,
      activeInstitutes,
      totalCourses,
      totalEnrollments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: "active" } }),
      prisma.institute.count(),
      prisma.institute.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.studentCourse.count(),
    ]);

    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);

    // Real system metrics
    const totalMem = os.totalmem() / 1024 / 1024; // MB
    const freeMem = os.freemem() / 1024 / 1024; // MB
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg()[0]; // 1-minute load average

    return res.status(200).json({
      status: "healthy",
      uptime: `${uptimeDays}d ${uptimeHours % 24}h`,
      metrics: {
        users: { total: totalUsers, active: activeUsers },
        institutes: { total: totalInstitutes, active: activeInstitutes },
        courses: { total: totalCourses },
        enrollments: { total: totalEnrollments },
      },
      database: "connected",
      redis: "not setup",
      serverLoad: cpuLoad,
      memoryUsage: {
        totalMB: Math.round(totalMem),
        usedMB: Math.round(usedMem),
        percentage: Math.round((usedMem / totalMem) * 100)
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching health:", error);
    return res.status(500).json({
      status: "unhealthy",
      error: "Failed to fetch metrics",
    });
  }
};

/**
 * Get revenue analytics
 * GET /admin/revenue
 */
export const getRevenueAnalytics = async (req: IExtendedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get payment data
    const payments = await prisma.payment.findMany({
      where: { status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Group by month for chart data
    const monthlyRevenue: Record<string, number> = {};
    payments.forEach((p) => {
      const month = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount);
    });

    const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    })).reverse();

    return res.status(200).json({
      totalRevenue,
      monthlyRevenue: chartData,
      growth: 12.5, // Would calculate from actual data
      transactions: payments.length,
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
