import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "@/models/User";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { validate } from "@/middleware/validate";
import { requireAuth } from "@/middleware/auth";
import { loginRateLimiter } from "@/middleware/rateLimit";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/middleware/auth";
import { writeAuditLog } from "@/common/audit";
import { isProd } from "@/config/env";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const REFRESH_COOKIE = "vja_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  path: "/api/admin/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) throw ApiError.unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role, email: user.email, name: user.name });
    const refreshToken = signRefreshToken(String(user._id));

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    req.user = { id: String(user._id), email: user.email, role: user.role, name: user.name };
    await writeAuditLog({ req, action: "login", entityType: "auth", entityId: String(user._id) });

    ok(res, { accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw ApiError.unauthorized();

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized("Session expired, please log in again");
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized();

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role, email: user.email, name: user.name });
    ok(res, { accessToken });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/admin/auth" });
  ok(res, { loggedOut: true });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, req.user);
  })
);

export const authRouter = router;
