import "express";
import { Role } from "@/common/constants";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
        name: string;
      };
      // Populated by requireCitizenAuth (middleware/citizenAuth.ts) —
      // entirely separate from `user` above (admin/staff), so a route can
      // never accidentally accept one token type in place of the other.
      citizen?: {
        id: string;
        username: string;
        mobile: string;
        fullName?: string;
      };
    }
  }
}
