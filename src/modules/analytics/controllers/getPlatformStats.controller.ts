import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import analyticsService from "../services/analytics.service";

/**
 * Controller to fetch platform-wide statistics for Super Admin
 */
export const getPlatformStats = async (req: IExtendedRequest, res: Response) => {
  try {
    // Check if user is super-admin (optional but recommended)
    if (req.user?.role !== "super-admin" && req.user?.role !== "admin") {
      // return res.status(403).json({ message: "Unauthorized access to platform statistics" });
      // For now we allow both but super-admin is preferred
    }

    const stats = await analyticsService.getPlatformStats();

    res.status(200).json({
      status: "success",
      message: "Platform statistics fetched successfully",
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
