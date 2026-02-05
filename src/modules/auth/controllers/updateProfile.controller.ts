import { Response } from "express";
import prisma from "@core/database/prisma";
import { IExtendedRequest } from "@core/middleware/type";

/**
 * Update current user profile text fields
 * PUT /auth/profile
 */
export const updateProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone, bio } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        bio,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileImage: true,
        phone: true,
        bio: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
