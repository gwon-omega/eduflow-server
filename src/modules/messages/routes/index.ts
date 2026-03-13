import express, { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getConversations } from "../controllers/getConversations.controller";
import { getAdminSupportChats } from "../controllers/getAdminSupportChats.controller";
import { getMessages } from "../controllers/getMessages.controller";
import { startConversation } from "../controllers/startConversation.controller";
import { sendMessage } from "../controllers/sendMessage.controller";
import { markConversationRead } from "../controllers/markConversationRead.controller";

const router: Router = express.Router();

// List conversations for the current user
router.get("/conversations", authenticate, getConversations);

// Find or create a direct conversation (body: { recipientId })
router.post("/conversations", authenticate, startConversation);

// Get paginated messages in a conversation
router.get("/conversations/:id/messages", authenticate, getMessages);

// Send a message to a conversation
router.post("/conversations/:id/messages", authenticate, sendMessage);

// Mark a conversation as read
router.put("/conversations/:id/read", authenticate, markConversationRead);

// Admin: list all support conversations
router.get("/admin/support", authenticate, getAdminSupportChats);

export default router;
