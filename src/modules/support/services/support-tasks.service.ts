import cron from "node-cron";
import prisma from "../../../core/database/prisma";
import { TicketStatus, TicketPriority } from "@prisma/client";
import pushService from "../../notification/services/push.service";

/**
 * Support Tasks Service
 *
 * Handles automated background operations for the Support module.
 */
export class SupportTasksService {
  /**
   * Initializes cron jobs for support ticket management.
   */
  static init() {
    // 1. Auto-escalate stale tickets every hour
    cron.schedule("0 * * * *", async () => {
      console.log("[Cron] Running Support Ticket Escalation...");
      await this.escalateStaleTickets();
    });
  }

  /**
   * Escalates tickets that have been open for more than 24 hours without activity.
   */
  private static async escalateStaleTickets() {
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    const staleTickets = await prisma.supportTicket.findMany({
      where: {
        status: TicketStatus.open,
        updatedAt: { lt: staleThreshold },
        priority: { not: TicketPriority.urgent }
      }
    });

    for (const ticket of staleTickets) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          priority: TicketPriority.urgent,
          updatedAt: new Date(),
        }
      });

      // Notify support staff (simplified: broadcasting to all staff could be refined)
      console.log(`[Escalation] Ticket ${ticket.ticketNumber} escalated to URGENT.`);
    }
  }
}

export default SupportTasksService;
