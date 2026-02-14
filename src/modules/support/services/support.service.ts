import supportRepo from "../repository/support.repo";
import { TicketPriority, TicketStatus } from "@prisma/client";

export class SupportService {
  async getMyTickets(userId: string, filters: any) {
    return supportRepo.findByUser(userId, filters);
  }

  async getTicketDetails(ticketId: string, isAdmin = false) {
    return supportRepo.findTicketDetails(ticketId, isAdmin);
  }

  async createTicket(data: { userId: string; instituteId?: string; subject: string; description: string; category: string; priority?: TicketPriority }) {
    const ticket = await supportRepo.createTicket(data);
    // Create initial message
    await supportRepo.addMessage({
      ticketId: ticket.id,
      senderId: data.userId,
      content: data.description,
      isInternal: false,
    });
    return ticket;
  }

  async addMessage(data: { ticketId: string; senderId: string; content: string; isInternal?: boolean; attachments?: string[] }) {
    const message = await supportRepo.addMessage(data);
    // Update ticket updatedAt
    await supportRepo.update(data.ticketId, { updatedAt: new Date() });
    return message;
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, userId: string) {
    const ticket = await supportRepo.findTicketDetails(ticketId, true);
    if (!ticket) throw new Error("Ticket not found");

    // State Machine Validation Logic
    const currentStatus = ticket.status as TicketStatus;

    // Prevent invalid transitions: e.g., Resolving a closed ticket, or Reopening from Resolved without context
    if (currentStatus === TicketStatus.closed) {
      throw new Error("Cannot modify a closed ticket. Please create a new support request.");
    }

    const data: any = { status, updatedAt: new Date() };

    if (status === TicketStatus.resolved || status === TicketStatus.closed) {
      data.resolvedAt = new Date();
    }

    // High-Integrity Resolution Audit
    const updatedTicket = await supportRepo.update(ticketId, data);

    // Log state change as a system message
    await supportRepo.addMessage({
      ticketId,
      senderId: userId,
      content: `[System Update] Ticket status changed from ${currentStatus} to ${status}`,
      isInternal: true,
    });

    return updatedTicket;
  }
}

export default new SupportService();
