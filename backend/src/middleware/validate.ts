import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "@/common/apiResponse";

// Validates req.body/query/params against a zod schema before the request
// reaches a controller. On failure, returns a generic 400 to the client
// while the specific field errors are attached for logging by errorHandler.
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      if (parsed.body) req.body = parsed.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        next(ApiError.badRequest(message));
        return;
      }
      next(err);
    }
  };
}
