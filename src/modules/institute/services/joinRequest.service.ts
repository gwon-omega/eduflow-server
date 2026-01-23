import joinRequestRepo from "../repository/joinRequest.repo";
import instituteRepo from "../repository/institute.repo";
import prisma from "@core/database/prisma";
import { Prisma, NotificationType, JoinRequestRole } from "@prisma/client";
import notificationService from "../../notification/services/notification.service";

class JoinRequestService {
  private readonly MAX_PENDING_REQUESTS = 3;

  async getPublicInstitutes(skip: number = 0, take: number = 12) {
    const where: Prisma.InstituteWhereInput = {
      isActive: true,
      deletedAt: null,
      accountStatus: { in: ["active", "trial"] },
    };

    const [institutes, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        select: {
          id: true,
          instituteName: true,
          subdomain: true,
          logo: true,
          address: true,
          type: true,
        },
        orderBy: { instituteName: "asc" },
        skip,
        take,
      }),
      prisma.institute.count({ where }),
    ]);

    return { institutes, total };
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
      if (existing.status === 'banned') {
        throw new Error("You are permanently banned from joining this institute.");
      }

      if (existing.status === 'approved') {
        throw new Error("You are already a member of this institute.");
      }

      if (existing.status === 'pending') {
        throw new Error("You have already requested to join this institute");
      }

      if (existing.status === 'rejected') {
        // Check cooldown (1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (existing.updatedAt > oneHourAgo) {
          const remainingMinutes = Math.ceil((existing.updatedAt.getTime() - oneHourAgo.getTime()) / 60000);
          throw new Error(`You can request again in ${remainingMinutes} minutes.`);
        }

        // Re-activate the request
        return await prisma.instituteJoinRequest.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            role: role as JoinRequestRole, // Allow role change on re-request
            message,
            updatedAt: new Date()
          }
        });
      }
    }

    // Check pending request limit
    const pendingCount = await joinRequestRepo.countPendingByUser(userId);
    if (pendingCount >= this.MAX_PENDING_REQUESTS) {
      throw new Error(
        `You can only have ${this.MAX_PENDING_REQUESTS} pending requests at a time`
      );
    }

    // Create request
    const request = await joinRequestRepo.create({
      userId,
      instituteId,
      role: role as JoinRequestRole,
      message,
    });

    // Notify Institute Owner
    if (institute.ownerId) {
      await notificationService.createNotification({
        userId: institute.ownerId,
        type: NotificationType.info,
        title: "New Join Request",
        message: `A new request to join as a ${role} has been submitted by a user.`,
        category: "institute",
        link: `/portals/institute/dashboard/requests`,
        metadata: { requestId: request.id, instituteId }
      });
    }

    return request;
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
    status: "approved" | "rejected" | "banned",
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

    // Use transaction to ensure status update and profile creation are atomic
    return prisma.$transaction(async (tx) => {
      // Update status
      const updated = await tx.instituteJoinRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedBy,
          reviewedAt: new Date(),
        },
        include: {
          user: true,
          institute: true,
        },
      });

      // If approved, create the student/teacher profile
      if (status === "approved" && request.user) {
        const user = request.user;

        if (request.role === "student") {
          await tx.student.create({
            data: {
              instituteId: request.instituteId,
              userId: request.userId,
              firstName: user.firstName || "Unknown",
              lastName: user.lastName || "User",
              email: user.email,
              phone: user.phone,
              photo: user.profileImage, // Map profileImage to student photo
              enrolledDate: new Date(),
            },
          });
        } else if (request.role === "teacher") {
          await tx.teacher.create({
            data: {
              instituteId: request.instituteId,
              userId: request.userId,
              firstName: user.firstName || "Unknown",
              lastName: user.lastName || "User",
              email: user.email,
              phone: user.phone || "",
              photo: user.profileImage, // Map profileImage to teacher photo
              experience: 0,
              salary: 0,
              joinedDate: new Date(),
            },
          });
        }
      }

      // Notify User of the result
      let title = "Join Request Update";
      let message = `Your request to join ${institute.instituteName} has been updated to ${status}.`;
      let type: NotificationType = NotificationType.info;

      if (status === "approved") {
        title = "Join Request Approved";
        message = `Your request to join ${institute.instituteName} has been approved.`;
        type = NotificationType.success;
      } else if (status === "rejected") {
        title = "Join Request Rejected";
        message = `Your request to join ${institute.instituteName} has been declined. You can try again in 1 hour.`;
        type = NotificationType.warning;
      } else if (status === "banned") {
        title = "Access Revoked";
        message = `You have been permanently banned from joining ${institute.instituteName}.`;
        type = NotificationType.alert;
      }

      await notificationService.createNotification({
        userId: request.userId,
        type,
        title,
        message,
        category: "system",
        link: status === "approved" ? "/portals/student/dashboard" : "/join-institute",
        metadata: { status, instituteId: request.instituteId }
      });

      return updated;
    });
  }
}

export default new JoinRequestService();
