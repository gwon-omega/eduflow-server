import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import messageRepo from "../repository/message.repo";

/**
 * GET /messages/conversations
 * Returns all conversations for the authenticated user.
 */
export const getConversations = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await messageRepo.getConversations(userId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
