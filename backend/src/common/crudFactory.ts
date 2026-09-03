import { Request, Response } from "express";
import { Model, FilterQuery } from "mongoose";
import { asyncHandler } from "./asyncHandler";
import { ok, paginated, ApiError } from "./apiResponse";
import { getPageParams } from "./pagination";
import { writeAuditLog } from "./audit";
import { CONTENT_STATUSES } from "./constants";

interface CrudFactoryOptions<T> {
  model: Model<T>;
  entityType: string;
  /** Extra query filters accepted on the public list endpoint, e.g. category/date range. */
  buildPublicFilter?: (req: Request) => FilterQuery<T>;
  buildAdminFilter?: (req: Request) => FilterQuery<T>;
  defaultSort?: Record<string, 1 | -1>;
  populate?: string | string[];
}

// A single implementation of the repetitive "list / get / create / update /
// change status / delete" shape that Activities, Events, News, Albums,
// Videos and Announcements all share (see docs/API.md). Keeping this in one
// place means a fix or a new safeguard (e.g. audit logging) applies to every
// content type at once instead of being copy-pasted six times.
export function createCrudController<T>(opts: CrudFactoryOptions<T>) {
  const { model, entityType, buildPublicFilter, buildAdminFilter, defaultSort = { publishAt: -1, createdAt: -1 }, populate } = opts;

  const publicList = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPageParams(req);
    const now = new Date();
    const filter: FilterQuery<T> = {
      status: "published",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      ...(buildPublicFilter ? buildPublicFilter(req) : {}),
    } as FilterQuery<T>;

    let query = model.find(filter).sort(defaultSort).skip(skip).limit(limit);
    if (populate) query = query.populate(populate as string);

    const [items, total] = await Promise.all([query.exec(), model.countDocuments(filter)]);
    paginated(res, items, page, limit, total);
  });

  const publicGet = asyncHandler(async (req: Request, res: Response) => {
    let query = model.findOne({ _id: req.params.id, status: "published" });
    if (populate) query = query.populate(populate as string);
    const doc = await query.exec();
    if (!doc) throw ApiError.notFound();
    ok(res, doc);
  });

  const adminList = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPageParams(req);
    const filter: FilterQuery<T> = (buildAdminFilter ? buildAdminFilter(req) : {}) as FilterQuery<T>;
    if (typeof req.query.status === "string" && CONTENT_STATUSES.includes(req.query.status as (typeof CONTENT_STATUSES)[number])) {
      (filter as Record<string, unknown>).status = req.query.status;
    }

    let query = model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    if (populate) query = query.populate(populate as string);

    const [items, total] = await Promise.all([query.exec(), model.countDocuments(filter)]);
    paginated(res, items, page, limit, total);
  });

  const adminGet = asyncHandler(async (req: Request, res: Response) => {
    let query = model.findById(req.params.id);
    if (populate) query = query.populate(populate as string);
    const doc = await query.exec();
    if (!doc) throw ApiError.notFound();
    ok(res, doc);
  });

  const adminCreate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    // Editors may only ever create drafts (§15) — regardless of what the client sends.
    const status = req.user.role === "editor" ? "draft" : req.body.status ?? "draft";
    const doc = await model.create({ ...req.body, status, createdBy: req.user.id });
    await writeAuditLog({ req, action: "create", entityType, entityId: doc._id as string, after: doc });
    ok(res, doc, 201);
  });

  const adminUpdate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const existing = await model.findById(req.params.id);
    if (!existing) throw ApiError.notFound();

    const update: Record<string, unknown> = { ...req.body, updatedBy: req.user.id };
    // Editors can edit content, but never move it out of draft via a plain update.
    if (req.user.role === "editor") delete update.status;

    const doc = await model.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    await writeAuditLog({ req, action: "update", entityType, entityId: req.params.id, before: existing, after: doc });
    ok(res, doc);
  });

  const adminUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: string };
    if (!CONTENT_STATUSES.includes(status as (typeof CONTENT_STATUSES)[number])) {
      throw ApiError.badRequest("Invalid status");
    }
    const existing = await model.findById(req.params.id);
    if (!existing) throw ApiError.notFound();

    const doc = await model.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user?.id, ...(status === "published" ? { publishAt: (existing as unknown as { publishAt?: Date }).publishAt ?? new Date() } : {}) },
      { new: true }
    );
    await writeAuditLog({ req, action: `status:${status}`, entityType, entityId: req.params.id, before: { status: (existing as unknown as { status: string }).status }, after: { status } });
    ok(res, doc);
  });

  const adminDelete = asyncHandler(async (req: Request, res: Response) => {
    const existing = await model.findById(req.params.id);
    if (!existing) throw ApiError.notFound();
    await model.findByIdAndDelete(req.params.id);
    await writeAuditLog({ req, action: "delete", entityType, entityId: req.params.id, before: existing });
    ok(res, { deleted: true });
  });

  return { publicList, publicGet, adminList, adminGet, adminCreate, adminUpdate, adminUpdateStatus, adminDelete };
}
