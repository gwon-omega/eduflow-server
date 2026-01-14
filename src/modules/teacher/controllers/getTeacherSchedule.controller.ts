import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../../core/types";
import teacherRepo from "../repository/teacher.repo";

export const getTeacherSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user!;
    const teacher = await teacherRepo.findByUserId(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const events = await teacherRepo.getSchedule(teacher.id);

    // Format for frontend
    const formattedEvents = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      day: new Date(e.startTime).toLocaleDateString('en-US', { weekday: 'short' }),
      startTime: new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / (1000 * 60 * 60), // hours
      room: e.location || "Online",
      type: e.type || "lecture",
      students: 0 // Placeholder count
    }));

    res.json(formattedEvents);
  } catch (error) {
    next(error);
  }
};
