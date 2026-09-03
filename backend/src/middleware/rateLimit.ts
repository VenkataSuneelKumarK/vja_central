import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests. Please slow down.", code: "RATE_LIMITED" } },
});

// Stricter limiter for the login route to blunt brute-force attempts.
export const loginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" } },
});
