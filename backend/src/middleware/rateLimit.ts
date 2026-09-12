import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests. Please slow down.", code: "RATE_LIMITED" } },
});

// Stricter limiter for the admin login route to blunt brute-force attempts
// against staff accounts — deliberately low, since legitimate admin login
// volume is tiny.
export const loginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" } },
});

// A separate, more generous limiter for citizen registration/login —
// deliberately its own budget rather than sharing loginRateLimiter's, since
// public citizen traffic volume is legitimately much higher than staff
// admin login attempts and the two shouldn't compete for the same quota.
export const citizenAuthRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.CITIZEN_AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many attempts. Please try again later.", code: "RATE_LIMITED" } },
});
