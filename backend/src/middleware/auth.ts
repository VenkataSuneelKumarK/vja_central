import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { ApiError } from "@/common/apiResponse";
import { Role } from "@/common/constants";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
  name: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

// Attaches req.user from a Bearer access token. Throws 401 if missing/invalid
// rather than silently continuing — every route that uses this must be an
// authenticated one (public routes simply don't apply this middleware).
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized();
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired session");
  }
}
