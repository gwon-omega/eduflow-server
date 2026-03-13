import prisma from "../../../core/database/prisma";

function buildName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
}

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  profileImage: true,
} as const;

class MessageRepository {
  /**
   * Get all conversations for a user, ordered by most recent activity.
   */
  async getConversations(userId: string, type?: string) {
    const participantRecords = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        leftAt: null,
        conversation: type ? { type: type as any } : undefined,
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { leftAt: null },
              include: {
                user: { select: userSelect },
              },
            },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                content: true,
                senderId: true,
                createdAt: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversation: { lastMessageAt: "desc" },
      },
    });

    const conversations = await Promise.all(
      participantRecords.map(async (pr) => {
        const conv = pr.conversation;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            deletedAt: null,
            ...(pr.lastReadAt ? { createdAt: { gt: pr.lastReadAt } } : {}),
          },
        });

        const otherParticipants = conv.participants
          .filter((p) => p.userId !== userId)
          .map((p) => ({
            id: p.user.id,
            name: buildName(p.user.firstName, p.user.lastName),
            email: p.user.email,
            role: p.user.role as string,
            profileImage: p.user.profileImage ?? null,
          }));

        const lastMsg = conv.messages[0] ?? null;

        return {
          id: conv.id,
          type: conv.type as string,
          title: conv.title ?? null,
          lastMessageAt: conv.lastMessageAt,
          lastMessage: lastMsg
            ? {
                content: lastMsg.type === "text" ? lastMsg.content : `[${lastMsg.type}]`,
                senderId: lastMsg.senderId,
                isMine: lastMsg.senderId === userId,
                createdAt: lastMsg.createdAt,
              }
            : null,
          participants: otherParticipants,
          unreadCount,
        };
      })
    );

    return conversations;
  }

  /**
   * Get all support conversations (admin use).
   */
  async getSupportConversations() {
    const conversations = await prisma.conversation.findMany({
      where: { type: "support" },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: userSelect },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return conversations.map((conv) => {
      const lastMsg = conv.messages[0] ?? null;
      return {
        id: conv.id,
        type: conv.type as string,
        title: conv.title ?? null,
        lastMessageAt: conv.lastMessageAt,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              senderId: lastMsg.senderId,
              createdAt: lastMsg.createdAt,
            }
          : null,
        participants: conv.participants.map((p) => ({
          id: p.user.id,
          name: buildName(p.user.firstName, p.user.lastName),
          email: p.user.email,
          role: p.user.role as string,
          profileImage: p.user.profileImage ?? null,
          isAdmin: p.isAdmin,
        })),
        unreadCount: 0,
      };
    });
  }

  /**
   * Find or create a direct conversation between two users.
   */
  async findOrCreateDirectConversation(
    userId: string,
    recipientId: string,
    instituteId?: string
  ) {
    // Find existing direct conversation between these two users
    const allConvos = await prisma.conversation.findMany({
      where: {
        type: "direct",
        ...(instituteId ? { instituteId } : {}),
        AND: [
          { participants: { some: { userId, leftAt: null } } },
          { participants: { some: { userId: recipientId, leftAt: null } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: userSelect } },
        },
      },
    });

    // Filter to exactly 2-participant conversations
    const existing = allConvos.find((c) => c.participants.length === 2);
    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        type: "direct",
        instituteId: instituteId ?? null,
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      include: {
        participants: {
          include: { user: { select: userSelect } },
        },
      },
    });
  }

  /**
   * Get paginated messages for a conversation (ascending order for display).
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50
  ) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new Error("Not a participant in this conversation");

    const messages = await prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        content: true,
        type: true,
        senderId: true,
        attachmentUrl: true,
        attachmentName: true,
        isEdited: true,
        createdAt: true,
        sender: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
      },
    });

    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type as string,
      senderId: m.senderId,
      senderName: buildName(m.sender.firstName, m.sender.lastName),
      senderAvatar: m.sender.profileImage ?? null,
      isMine: m.senderId === userId,
      isEdited: m.isEdited,
      createdAt: m.createdAt,
      attachmentUrl: m.attachmentUrl ?? null,
      attachmentName: m.attachmentName ?? null,
    }));
  }

  /**
   * Send a message in a conversation.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: "text" | "image" | "file" = "text"
  ) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant) throw new Error("Not a participant in this conversation");

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, senderId, content, type },
        select: {
          id: true,
          content: true,
          type: true,
          senderId: true,
          createdAt: true,
          sender: {
            select: { id: true, firstName: true, lastName: true, profileImage: true },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return {
      id: message.id,
      content: message.content,
      type: message.type as string,
      senderId: message.senderId,
      senderName: buildName(message.sender.firstName, message.sender.lastName),
      senderAvatar: message.sender.profileImage ?? null,
      isMine: true,
      isEdited: false,
      createdAt: message.createdAt,
      attachmentUrl: null,
      attachmentName: null,
    };
  }

  /**
   * Mark a conversation as read for a user (update lastReadAt).
   */
  async markAsRead(conversationId: string, userId: string) {
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  /**
   * Check if a user is a participant in a conversation.
   */
  async isParticipant(conversationId: string, userId: string) {
    const record = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    return !!record;
  }
}

export default new MessageRepository();