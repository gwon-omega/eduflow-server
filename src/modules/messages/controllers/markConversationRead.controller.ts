import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import messageRepo from "../repository/message.repo";

/**
 * PUT /messages/conversations/:id/read
 * Mark all messages in a conversation as read for the authenticated user.
 */
export const markConversationRead = async (
  req: IExtendedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id: conversationId } = req.params;

    const isParticipant = await messageRepo.isParticipant(
      conversationId,
      userId,
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await messageRepo.markAsRead(conversationId, userId);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
