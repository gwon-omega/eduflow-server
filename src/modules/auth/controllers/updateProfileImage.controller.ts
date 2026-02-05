import { Response } from "express";
import prisma from "@core/database/prisma";
import { IExtendedRequest } from "@core/middleware/type";

/**
 * Update current user profile image
 * POST /auth/profile/image
 */
export const updateProfileImage = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { profileImage } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!profileImage) {
      return res.status(400).json({
        success: false,
        message: "Profile image URL is required",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage,
      },
      select: {
        id: true,
        profileImage: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: updatedUser.profileImage,
    });
  } catch (error: any) {
    console.error("Error updating profile image:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
