import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { ApiError } from "@/common/apiResponse";

export interface CitizenAccessTokenPayload {
  sub: string;
  username: string;
  mobile: string;
  fullName?: string;
  // A distinct claim (on top of the already-separate secret) so a citizen
  // token can never be mistaken for an admin token even if the two secrets
  // were ever accidentally aligned — defense in depth, not the only guard.
  tokenType: "citizen_access";
}

export function signCitizenAccessToken(payload: Omit<CitizenAccessTokenPayload, "tokenType">): string {
  return jwt.sign({ ...payload, tokenType: "citizen_access" }, env.JWT_CITIZEN_ACCESS_SECRET, {
    expiresIn: env.JWT_CITIZEN_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function signCitizenRefreshToken(citizenId: string): string {
  return jwt.sign({ sub: citizenId, tokenType: "citizen_refresh" }, env.JWT_CITIZEN_REFRESH_SECRET, {
    expiresIn: env.JWT_CITIZEN_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyCitizenRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, env.JWT_CITIZEN_REFRESH_SECRET) as { sub: string; tokenType: string };
  if (payload.tokenType !== "citizen_refresh") throw new Error("Invalid token type");
  return payload;
}

// Mirrors middleware/auth.ts's requireAuth exactly in shape (Bearer header,
// throws ApiError.unauthorized on anything wrong) but reads req.citizen
// instead of req.user, using the fully separate citizen secret/payload.
export function requireCitizenAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized();
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_CITIZEN_ACCESS_SECRET) as CitizenAccessTokenPayload;
    if (payload.tokenType !== "citizen_access") throw new Error("Invalid token type");
    req.citizen = { id: payload.sub, username: payload.username, mobile: payload.mobile, fullName: payload.fullName };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired session");
  }
}
