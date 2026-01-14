import { Response } from "express";
import prisma from "@core/database/prisma";
import { IExtendedRequest } from "@core/middleware/type";

/**
 * Get all institutes for super admin
 * GET /institutes/admin/all
 */
export const getAllInstitutes = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Only super admins can access this
    if (userRole !== "superadmin" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin only.",
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { instituteName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Map status filter to accountStatus
    if (status && status !== "all") {
      if (status === "active") {
        where.isActive = true;
        where.accountStatus = { not: "suspended" };
      } else if (status === "suspended") {
        where.accountStatus = "suspended";
      } else if (status === "pending") {
        where.accountStatus = "trial";
      }
    }

    // Get institutes with counts
    const [institutes, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          instituteName: true,
          email: true,
          type: true,
          subdomain: true,
          isActive: true,
          accountStatus: true,
          subscriptionTier: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
              teachers: true,
            },
          },
        },
      }),
      prisma.institute.count({ where }),
    ]);

    // Format response
    const formattedInstitutes = institutes.map((inst) => ({
      id: inst.id,
      name: inst.instituteName,
      email: inst.email || "N/A",
      type: inst.type,
      subdomain: inst.subdomain,
      status: inst.accountStatus === "suspended" ? "suspended"
            : inst.accountStatus === "trial" ? "pending"
            : inst.isActive ? "active" : "inactive",
      plan: inst.subscriptionTier === "enterprise" ? "Enterprise"
          : inst.subscriptionTier === "pro" ? "Professional"
          : inst.subscriptionTier === "basic" ? "Basic"
          : "Trial",
      students: inst._count.students,
      teachers: inst._count.teachers,
      joined: inst.createdAt,
    }));

    return res.status(200).json({
      institutes: formattedInstitutes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching institutes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
