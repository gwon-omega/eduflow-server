import joinRequestRepo from "../repository/joinRequest.repo";
import instituteRepo from "../repository/institute.repo";
import prisma from "@core/database/prisma";

class JoinRequestService {
  private readonly MAX_PENDING_REQUESTS = 3;

  async getPublicInstitutes() {
    return prisma.institute.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        instituteName: true,
        subdomain: true,
        logo: true,
        address: true,
        type: true,
      },
      orderBy: { instituteName: "asc" },
      take: 100,
    });
  }

  async createJoinRequest(
    userId: string,
    instituteId: string,
    role: string,
    message?: string
  ) {
    // Validate role (now using enum, but still validate input string)
    const validRoles = ["student", "teacher"];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role. Must be 'student' or 'teacher'");
    }

    // Check if institute exists
    const institute = await instituteRepo.findById(instituteId);
    if (!institute) {
      throw new Error("Institute not found");
    }

    // Check if already requested
    const existing = await joinRequestRepo.findByUserAndInstitute(
      userId,
      instituteId
    );
    if (existing) {
      throw new Error("You have already requested to join this institute");
    }

    // Check pending request limit
    const pendingCount = await joinRequestRepo.countPendingByUser(userId);
    if (pendingCount >= this.MAX_PENDING_REQUESTS) {
      throw new Error(
        `You can only have ${this.MAX_PENDING_REQUESTS} pending requests at a time`
      );
    }

    // Create request
    return joinRequestRepo.create({
      userId,
      instituteId,
      role,
      message,
    });
  }

  async getUserRequests(userId: string) {
    return joinRequestRepo.findByUserId(userId);
  }

  async getInstituteRequests(instituteId: string, userId: string) {
    // Verify user owns the institute
    const institute = await instituteRepo.findById(instituteId);
    if (!institute || institute.ownerId !== userId) {
      throw new Error("Not authorized to view requests for this institute");
    }

    return joinRequestRepo.findByInstituteId(instituteId);
  }

  async reviewRequest(
    requestId: string,
    status: "approved" | "rejected",
    reviewedBy: string
  ) {
    // Get the request
    const request = await joinRequestRepo.findById(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Verify reviewer owns the institute
    const institute = await instituteRepo.findById(request.instituteId);
    if (!institute || institute.ownerId !== reviewedBy) {
      throw new Error("Not authorized to review this request");
    }

    // Update status
    const updated = await joinRequestRepo.updateStatus(
      requestId,
      status,
      reviewedBy
    );

    // If approved, create the student/teacher profile
    if (status === "approved" && request.user) {
      const user = request.user;
      if (request.role === "student") {
        await prisma.student.create({
          data: {
            instituteId: request.instituteId,
            userId: request.userId,
            firstName: user.firstName || "Unknown",
            lastName: user.lastName || "User",
            email: user.email,
            phone: user.phone,
            enrolledDate: new Date(),
          },
        });
      } else if (request.role === "teacher") {
        await prisma.teacher.create({
          data: {
            instituteId: request.instituteId,
            userId: request.userId,
            firstName: user.firstName || "Unknown",
            lastName: user.lastName || "User",
            email: user.email,
            phone: user.phone || "",
            experience: 0,
            salary: 0,
            joinedDate: new Date(),
          },
        });
      }
    }

    return updated;
  }
}

export default new JoinRequestService();
