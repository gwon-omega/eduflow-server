import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import teacherService from "../services/teacher.service";

export const createTeacher = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute context required" });
    }

    const teacherData = req.body;

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "experience",
      "salary",
      "joinedDate"
    ];

    for (const field of requiredFields) {
      if (!teacherData[field]) {
        return res.status(400).json({ message: `Required field missing: ${field}` });
      }
    }

    const teacher = await teacherService.createTeacher(instituteId, teacherData, req.file);

    res.status(201).json({
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
