import { Response } from "express";
import { env } from "@/config/env";
import { signMediaUrlsDeep } from "@/config/s3";

// Every route in the app sends its response through ok()/paginated() — that
// makes this the one place to sign outgoing media URLs (when AWS_S3_PRIVATE
// is on) instead of touching every individual route that happens to return
// a coverImage/thumbnailUrl/videoUrl/attachments[].url field. Callers keep
// calling these exactly as before (no `await`, same signature) — the
// signing work happens on a promise chain that resolves to res.json()
// whenever it's ready, same pattern Express already tolerates for any
// async work started inside a request handler.
export function ok<T>(res: Response, data: T, status = 200) {
  if (!env.AWS_S3_PRIVATE) return res.status(status).json({ success: true, data });

  const plain = JSON.parse(JSON.stringify(data));
  signMediaUrlsDeep(plain)
    .then((signed) => res.status(status).json({ success: true, data: signed }))
    .catch(() => res.status(status).json({ success: true, data: plain }));
  return res;
}

export function paginated<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number
) {
  const body = { items, page, limit, total, hasMore: page * limit < total };
  if (!env.AWS_S3_PRIVATE) return res.status(200).json({ success: true, data: body });

  const plain = JSON.parse(JSON.stringify(body));
  signMediaUrlsDeep(plain)
    .then((signed) => res.status(200).json({ success: true, data: signed }))
    .catch(() => res.status(200).json({ success: true, data: plain }));
  return res;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }

  static badRequest(message = "Invalid request") {
    return new ApiError(400, message, "BAD_REQUEST");
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }
  static forbidden(message = "You do not have permission to perform this action") {
    return new ApiError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }
  static conflict(message = "Conflict") {
    return new ApiError(409, message, "CONFLICT");
  }
}
