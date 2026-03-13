import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import messageRepo from "../repository/message.repo";

/**
 * POST /messages/conversations
 * Find or create a direct conversation with a recipient.
 * Body: { recipientId: string }
 */
export const startConversation = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { recipientId } = req.body as { recipientId?: string };
    if (!recipientId) {
      return res
        .status(400)
        .json({ success: false, message: "recipientId is required" });
    }
    if (recipientId === userId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot start conversation with yourself" });
    }

    const instituteId = req.instituteId ?? undefined;
    const data = await messageRepo.findOrCreateDirectConversation(
      userId,
      recipientId,
      instituteId
    );

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
