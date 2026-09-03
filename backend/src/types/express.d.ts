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
    }
  }
}
