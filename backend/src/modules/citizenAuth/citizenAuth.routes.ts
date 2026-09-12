import { Router } from "express";
import bcrypt from "bcryptjs";
import { Citizen } from "@/models/Citizen";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { validate } from "@/middleware/validate";
import { citizenAuthRateLimiter } from "@/middleware/rateLimit";
import {
  requireCitizenAuth,
  signCitizenAccessToken,
  signCitizenRefreshToken,
  verifyCitizenRefreshToken,
} from "@/middleware/citizenAuth";
import { isProd } from "@/config/env";
import { registerSchema, loginSchema } from "./citizenAuth.validation";

const router = Router();

const REFRESH_COOKIE = "vja_citizen_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  path: "/api/citizen/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function citizenPublicShape(citizen: { _id: unknown; username: string; mobile: string; fullName?: string }) {
  return { id: citizen._id, username: citizen.username, mobile: citizen.mobile, fullName: citizen.fullName };
}

router.post(
  "/register",
  citizenAuthRateLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { username, mobile, password, fullName } = req.body;
    const normalizedUsername = username.toLowerCase();

    const [existingUsername, existingMobile] = await Promise.all([
      Citizen.findOne({ username: normalizedUsername }),
      Citizen.findOne({ mobile }),
    ]);
    if (existingUsername) throw ApiError.conflict("This username is already taken");
    if (existingMobile) throw ApiError.conflict("This mobile number is already registered");

    const passwordHash = await bcrypt.hash(password, 12);
    const citizen = await Citizen.create({ username: normalizedUsername, mobile, passwordHash, fullName });

    // §4 of the spec: auto-authenticate after registration, no forced
    // second login — same accessToken+refresh-cookie issuance as login.
    const accessToken = signCitizenAccessToken({ sub: String(citizen._id), username: citizen.username, mobile: citizen.mobile, fullName: citizen.fullName });
    const refreshToken = signCitizenRefreshToken(String(citizen._id));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

    // refreshToken is also returned in the body (not just the httpOnly
    // cookie) so the mobile app — which has no shared browser cookie jar —
    // can persist it itself. Purely additive: the admin/web flow keeps
    // using the cookie and never reads this field.
    ok(res, { accessToken, refreshToken, citizen: citizenPublicShape(citizen) }, 201);
  })
);

router.post(
  "/login",
  citizenAuthRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body as { identifier: string; password: string };
    const normalized = identifier.trim().toLowerCase();

    const citizen = await Citizen.findOne({
      $or: [{ username: normalized }, { mobile: identifier.replace(/\D/g, "") }],
      isActive: true,
    });
    if (!citizen) throw ApiError.unauthorized("Invalid username/mobile or password");

    const valid = await bcrypt.compare(password, citizen.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid username/mobile or password");

    const accessToken = signCitizenAccessToken({ sub: String(citizen._id), username: citizen.username, mobile: citizen.mobile, fullName: citizen.fullName });
    const refreshToken = signCitizenRefreshToken(String(citizen._id));
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

    ok(res, { accessToken, refreshToken, citizen: citizenPublicShape(citizen) });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    // Web/admin relies on the httpOnly cookie; mobile has no shared cookie
    // jar across app restarts, so it sends the refreshToken it persisted
    // from register/login in the request body instead.
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    if (!token) throw ApiError.unauthorized();

    let payload: { sub: string };
    try {
      payload = verifyCitizenRefreshToken(token);
    } catch {
      throw ApiError.unauthorized("Session expired, please log in again");
    }

    const citizen = await Citizen.findById(payload.sub);
    if (!citizen || !citizen.isActive) throw ApiError.unauthorized();

    const accessToken = signCitizenAccessToken({ sub: String(citizen._id), username: citizen.username, mobile: citizen.mobile, fullName: citizen.fullName });
    ok(res, { accessToken });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/citizen/auth" });
  ok(res, { loggedOut: true });
});

router.get(
  "/me",
  requireCitizenAuth,
  asyncHandler(async (req, res) => {
    ok(res, req.citizen);
  })
);

export const citizenAuthRouter = router;
