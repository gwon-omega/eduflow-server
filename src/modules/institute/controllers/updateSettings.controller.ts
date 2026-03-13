import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import instituteRepo from "../repository/institute.repo";

export const updateSettings = async (req: IExtendedRequest, res: Response) => {
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

    const { instituteName, email, phone, address } = req.body || {};

    const updated = await instituteRepo.update(instituteId, {
      ...(typeof instituteName === "string" ? { instituteName } : {}),
      ...(typeof email === "string" ? { email } : {}),
      ...(typeof phone === "string" ? { phone } : {}),
      ...(typeof address === "string" ? { address } : {}),
    });

    return res.status(200).json({
      success: true,
      message: "Institute settings updated successfully",
      data: {
        id: updated.id,
        instituteName: updated.instituteName,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        logo: updated.logo,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        panNo: updated.panNo,
        vatNo: updated.vatNo,
        subscriptionTier: updated.subscriptionTier,
        subscriptionExpiresAt: updated.subscriptionExpiresAt,
        accountStatus: updated.accountStatus,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    console.error("Error updating institute settings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
