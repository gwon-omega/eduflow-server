
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    instituteId?: string;
    [key: string]: any;
  };
}
