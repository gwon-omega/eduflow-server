import scheduleRepo from "../repository/schedule.repo";
import { ScheduleEvent, ScheduleEventType } from "@prisma/client";

/**
 * Schedule Service
 *
 * Manages academic and institute schedules with conflict detection.
 */
export class ScheduleService {
  /**
   * Checks for scheduling conflicts within a specific institute and room/teacher.
   */
  async checkConflicts(instituteId: string, startTime: Date, endTime: Date, metadata: { teacherId?: string; location?: string; excludeId?: string }) {
    const events = await scheduleRepo.getEventsByRange(instituteId, startTime, endTime);

    return events.filter((event: ScheduleEvent) => {
      // Skip the event itself if updating
      if (metadata.excludeId && event.id === metadata.excludeId) return false;

      // Conflict if same teacher at same time
      if (metadata.teacherId && event.teacherId === metadata.teacherId) return true;

      // Conflict if same location at same time
      if (metadata.location && event.location === metadata.location) return true;

      return false;
    });
  }

  /**
   * Creates an exam schedule event with strict conflict detection.
   */
  async createExamSchedule(instituteId: string, data: any) {
    const { startTime, endTime, location, teacherId } = data;

    const conflicts = await this.checkConflicts(instituteId, new Date(startTime), new Date(endTime), {
      teacherId,
      location
    });

    if (conflicts.length > 0) {
      throw new Error(`Scheduling conflict detected: ${conflicts[0].title} is already scheduled at this time/location.`);
    }

    return scheduleRepo.create({
      ...data,
      instituteId,
      type: ScheduleEventType.exam
    });
  }
}

export default new ScheduleService();
