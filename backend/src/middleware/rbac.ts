import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/common/apiResponse";
import { Role } from "@/common/constants";

// Usage: router.delete("/:id", requireAuth, requireRole(DELETE_ROLES), handler)
export function requireRole(allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (!allowed.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
