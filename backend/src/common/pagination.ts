import { Request } from "express";

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export function getPageParams(req: Request): PageParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const rawLimit = parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}
