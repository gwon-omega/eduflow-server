import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import messageRepo from "../repository/message.repo";

/**
 * POST /messages/conversations/:id/messages
 * Send a message in a conversation.
 * Body: { content: string, type?: "text" | "image" | "file" }
 */
export const sendMessage = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id: conversationId } = req.params;
    const { content, type = "text" } = req.body as {
      content?: string;
      type?: "text" | "image" | "file";
    };

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message content is required" });
    }

    const data = await messageRepo.sendMessage(
      conversationId,
      userId,
      content.trim(),
      type,
    );

    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (error.message === "Not a participant in this conversation") {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
