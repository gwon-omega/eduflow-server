import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import instituteRepo from "../repository/institute.repo";

export const getSettings = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId || (req as any).tenantId;

    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: "Institute ID is required",
      });
    }

    const institute = await instituteRepo.findById(instituteId);

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    // Return the settings including subscription info
    return res.status(200).json({
      success: true,
      data: {
        id: institute.id,
        instituteName: institute.instituteName,
        email: institute.email,
        phone: institute.phone,
        address: institute.address,
        logo: institute.logo,
        primaryColor: institute.primaryColor,
        secondaryColor: institute.secondaryColor,
        panNo: institute.panNo,
        vatNo: institute.vatNo,
        subscriptionTier: institute.subscriptionTier,
        subscriptionExpiresAt: institute.subscriptionExpiresAt,
        accountStatus: institute.accountStatus,
        isActive: institute.isActive,
      },
    });
  } catch (error: any) {
    console.error("Error fetching institute settings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
