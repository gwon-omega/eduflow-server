import { Request, Response } from "express";
import dashboardService from "../services/dashboard.service";

export class DashboardController {
  async getOverview(req: Request, res: Response) {
    try {
      const instituteId = (req as any).instituteId || (req as any).tenantId;
      if (!instituteId) {
        return res.status(400).json({ success: false, message: "Institute ID is required" });
      }

      const data = await dashboardService.getInstituteOverview(instituteId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new DashboardController();
