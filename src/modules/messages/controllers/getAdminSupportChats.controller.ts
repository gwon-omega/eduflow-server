import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import messageRepo from "../repository/message.repo";

/**
 * GET /messages/admin/support
 * Returns all support conversations (admin only).
 */
export const getAdminSupportChats = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const data = await messageRepo.getSupportConversations();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
