import teacherRepo from "../repository/teacher.repo";
import { Teacher } from "@prisma/client";
import firebaseStorage from "../../../core/services/firebaseStorage";

export class TeacherService {
  async getTeacherByEmail(email: string, instituteId: string) {
    return teacherRepo.findByEmail(email, instituteId);
  }

  async getTeacherProfile(userId: string) {
    return teacherRepo.findByUserId(userId);
  }

  async updateTeacherProfile(teacherId: string, data: Partial<Teacher>) {
    return teacherRepo.update(teacherId, data);
  }

  async getAllTeachers(instituteId: string) {
    return teacherRepo.findMany({
      where: { instituteId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTeacher(instituteId: string, data: any, file?: any) {
    let photoUrl = data.teacherPhoto || "https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";

    if (file) {
      photoUrl = await firebaseStorage.uploadFile(
        file.buffer,
        `teachers/photos/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }

    const teacherData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      experience: parseInt(data.experience, 10),
      salary: parseFloat(data.salary),
      joinedDate: new Date(data.joinedDate),
      photo: photoUrl,
      instituteId,
    };

    // If courseId is provided, we might need a custom create in Repo or handle it here
    // But since BaseRepository just uses this.model.create({ data }),
    // we can pass nested creates if supported by Prisma schema
    if (data.courseId) {
      teacherData.courses = {
        create: [{ courseId: data.courseId }]
      };
    }

    return teacherRepo.create(teacherData);
  }
}

export default new TeacherService();
