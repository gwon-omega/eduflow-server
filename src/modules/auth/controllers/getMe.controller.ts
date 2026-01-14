import { Response } from "express";
import prisma from "@core/database/prisma";
import { IExtendedRequest } from "@core/middleware/type";

/**
 * Get current authenticated user
 * GET /auth/me
 */
export const getMe = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileImage: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
