import { Request, Response } from "express";
import joinRequestService from "../services/joinRequest.service";

// GET /institutes/public - List all public institutes
export const getPublicInstitutes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const { institutes, total } = await joinRequestService.getPublicInstitutes(skip, limit);

    res.json({
      success: true,
      institutes,
      total,
      page,
      limit
    });
  } catch (error: any) {
    console.error("Error fetching public institutes:", error);
    res.status(500).json({ message: "Failed to fetch institutes" });
  }
};

// POST /institutes/:id/join - Request to join an institute
export const requestJoinInstitute = async (req: Request, res: Response) => {
  try {
    const { id: instituteId } = req.params;
    const { role, message } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const request = await joinRequestService.createJoinRequest(
      userId,
      instituteId,
      role,
      message
    );

    res.status(201).json({
      message: "Join request submitted successfully",
      request,
    });
  } catch (error: any) {
    console.error("Error creating join request:", error);
    res.status(400).json({ message: error.message || "Failed to submit request" });
  }
};

// GET /institutes/my-requests - Get user's join requests
export const getMyJoinRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requests = await joinRequestService.getUserRequests(userId);
    res.json({ requests });
  } catch (error: any) {
    console.error("Error fetching join requests:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// GET /institutes/:id/requests - Get institute's pending join requests (owner only)
export const getInstituteJoinRequests = async (req: Request, res: Response) => {
  try {
    const { id: instituteId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requests = await joinRequestService.getInstituteRequests(
      instituteId,
      userId
    );
    res.json({ requests });
  } catch (error: any) {
    console.error("Error fetching institute requests:", error);
    res.status(403).json({ message: error.message || "Failed to fetch requests" });
  }
};

// PATCH /institutes/requests/:id - Approve or reject a join request
export const reviewJoinRequest = async (req: Request, res: Response) => {
  try {
    const { id: requestId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const updated = await joinRequestService.reviewRequest(
      requestId,
      status,
      userId
    );

    res.json({
      message: `Request ${status} successfully`,
      request: updated,
    });
  } catch (error: any) {
    console.error("Error reviewing request:", error);
    res.status(400).json({ message: error.message || "Failed to review request" });
  }
};
