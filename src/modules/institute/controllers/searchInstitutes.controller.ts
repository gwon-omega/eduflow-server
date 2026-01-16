import { Request, Response } from "express";
import instituteRepo from "../repository/institute.repo";

/**
 * Search Institutes
 * GET /institutes/search?q=query
 *
 * Public endpoint to allow prospective students/teachers
 * to find institutes to join.
 */
export const searchInstitutes = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const { institutes, total } = await instituteRepo.search(query, skip, limit);

    res.json({
      success: true,
      institutes,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Search institutes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search institutes",
    });
  }
};
