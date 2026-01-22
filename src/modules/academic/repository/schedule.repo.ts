import { BaseRepository } from "@core/repository/BaseRepository";
import { ScheduleEvent } from "@prisma/client";

export class ScheduleRepo extends BaseRepository<ScheduleEvent> {
  constructor() {
    super("scheduleEvent");
  }

  async getUpcomingEvents(instituteId: string, limit: number = 5) {
    return this.model.findMany({
      where: {
        instituteId,
        startTime: {
          gte: new Date(),
        },
      },
      take: limit,
      orderBy: {
        startTime: "asc",
      },
    });
  }

  async getEventsByRange(instituteId: string, startDate: Date, endDate: Date) {
    return this.model.findMany({
      where: {
        instituteId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }
}

export default new ScheduleRepo();
