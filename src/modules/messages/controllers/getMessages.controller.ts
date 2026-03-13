import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import messageRepo from "../repository/message.repo";

/**
 * GET /messages/conversations/:id/messages?page=1&limit=50
 * Returns paginated messages for a conversation the user participates in.
 */
export const getMessages = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "50", 10);

    const data = await messageRepo.getMessages(id, userId, page, limit);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message === "Not a participant in this conversation") {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
