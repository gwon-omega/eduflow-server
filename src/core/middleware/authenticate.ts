import { Response, NextFunction } from "express";
import * as jose from "jose";
import { IExtendedRequest } from "./type";
import prisma from "../database/prisma";
import { contextStorage } from "../utils/contextStore";
import { JWT_SECRET_UINT8 } from "../config/jwt.config";

export const authenticate = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
  try {
    let token = "";
    const authHeader = req.headers.authorization;

    // 1. Resolve Identity (Who is the user?)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.eduflow_auth_token) {
      token = req.cookies.eduflow_auth_token;
    }

    if (!token) {
      console.log("[Auth Debug] No token provided in headers or cookies");
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      console.log("[Auth Debug] Verifying token length:", token.length);
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_UINT8);
      console.log("[Auth Debug] Token verified successfully for user:", payload.id);

      if (!payload || !payload.id) {
        console.error("[Auth Debug] Token verified but payload is missing 'id'");
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      req.user = payload as any;
    } catch (jwtErr: any) {
      console.error("[Auth Debug] JWT Verify failed:", jwtErr.message);
      return res.status(401).json({
        message: "Invalid or expired token",
        debug: process.env.NODE_ENV === "development" ? jwtErr.message : undefined,
        code: jwtErr.code || "JWT_ERROR"
      });
    }

    // 2. Resolve Context (Which institute are they accessing?)
    // Priority 1: Subdomain (Hardest to spoof)
    console.log("[Auth Debug] Resolving context. req.tenant:", req.tenant);
    if (req.tenant?.subdomain) {
      console.log("[Auth Debug] Resolution by subdomain:", req.tenant.subdomain);
      const institute = await prisma.institute.findUnique({
        where: { subdomain: req.tenant.subdomain },
        select: { id: true, ownerId: true }
      });

      if (!institute) {
        console.warn("[Auth Debug] Institute not found for subdomain:", req.tenant.subdomain);
        return res.status(404).json({
          status: "error",
          message: "Institute not found at this subdomain",
          code: "INVALID_TENANT"
        });
      }

      req.instituteId = institute.id;
      console.log("[Auth Debug] Resolved instituteId via subdomain:", req.instituteId);

      // Security check: Does user have access to THIS institute?
      if (req.user?.role !== "super-admin") {
         if (institute.ownerId === req.user?.id) {
            console.log("[Auth Debug] Authorized as owner");
         } else {
            console.log("[Auth Debug] Checking membership for user in institute:", institute.id);
            const [student, teacher] = await Promise.all([
               prisma.student.findFirst({ where: { userId: req.user?.id, instituteId: institute.id } }),
               prisma.teacher.findFirst({ where: { userId: req.user?.id, instituteId: institute.id } })
            ]);

            const isMember = !!(student || teacher);
            (req as any).isMember = isMember;
            console.log("[Auth Debug] Membership status:", isMember);
         }
      }
    }
    // Priority 2: Query/Body (For cross-origin or admin actions)
    else {
      console.log("[Auth Debug] Resolution by query/body. req.query:", req.query ? "exists" : "MISSING", "req.body:", req.body ? "exists" : "MISSING");
      req.instituteId = (req.query?.instituteId as string) || (req.body?.instituteId as string);

      // Fallback: Default to their own institute if they are an admin
      if (!req.instituteId && (req.user?.role === "institute" || req.user?.role === "admin")) {
        console.log("[Auth Debug] Fallback to owned institute for admin");
        const owned = await prisma.institute.findFirst({
           where: { ownerId: req.user?.id },
           select: { id: true }
        });
        if (owned) {
          req.instituteId = owned.id;
          console.log("[Auth Debug] Resolved fallback instituteId:", req.instituteId);
        }
      }
    }

    // 3. Attach Contextual Prisma Client (Phase 3: RLS Implementation)
    req.prisma = prisma;

    console.log("[Auth Debug] Final req.instituteId:", req.instituteId);

    // Wrap the rest of the request in the context
    contextStorage.run({
      instituteId: req.instituteId || "",
      userId: req.user?.id,
      role: req.user?.role
    }, () => {
      next();
    });
  } catch (error: any) {
    console.error("[Auth Debug] Global Middleware Error Type:", typeof error);
    console.error("[Auth Debug] Global Middleware Error Stack:", error.stack);
    console.error("[Auth Debug] Global Middleware Error Message:", error.message || error);
    return res.status(401).json({
      message: "Authentication failed",
      code: "AUTH_ERROR",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
