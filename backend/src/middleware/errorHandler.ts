import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/common/apiResponse";
import { logger } from "@/config/logger";
import { isProd } from "@/config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler — the ONLY place that decides what a client
// sees. Technical details (stack traces, DB errors) are always logged
// server-side; the client only ever gets a safe, generic message (§34 of
// the brief) unless the error was explicitly raised as an ApiError.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.status >= 500) logger.error(err.message, { err, path: req.originalUrl });
    res.status(err.status).json({ success: false, error: { message: err.message, code: err.code } });
    return;
  }

  logger.error("Unhandled error", { err, path: req.originalUrl });
  res.status(500).json({
    success: false,
    error: {
      message: "Something went wrong on our end. Please try again.",
      code: "INTERNAL_ERROR",
      ...(isProd ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
}
