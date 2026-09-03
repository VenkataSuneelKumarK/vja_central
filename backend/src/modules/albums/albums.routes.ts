import { Router } from "express";
import { Album, IAlbum } from "@/models/Album";
import { Photo } from "@/models/Photo";
import { createCrudController } from "@/common/crudFactory";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, paginated, ApiError } from "@/common/apiResponse";
import { getPageParams } from "@/common/pagination";
import { writeAuditLog } from "@/common/audit";
import { DELETE_ROLES, WRITE_ROLES, PUBLISH_ROLES, DASHBOARD_ROLES } from "@/common/constants";
import {
  createAlbumSchema,
  updateAlbumSchema,
  updateStatusSchema,
  addPhotosSchema,
  reorderPhotosSchema,
  updatePhotoSchema,
} from "./albums.validation";

const controller = createCrudController<IAlbum>({ model: Album, entityType: "album" });

const router = Router();
router.get("/albums", controller.publicList);
router.get("/albums/:id", controller.publicGet);

// Photos are paginated independently — never load a whole album at once (§6, §19).
router.get(
  "/albums/:id/photos",
  asyncHandler(async (req, res) => {
    const album = await Album.findOne({ _id: req.params.id, status: "published" });
    if (!album) throw ApiError.notFound();

    const { page, limit, skip } = getPageParams(req);
    const filter = { albumId: album._id };
    const [items, total] = await Promise.all([
      Photo.find(filter).sort({ sortOrder: 1 }).skip(skip).limit(limit),
      Photo.countDocuments(filter),
    ]);
    paginated(res, items, page, limit, total);
  })
);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", requireRole(DASHBOARD_ROLES), controller.adminList);
adminRouter.get("/:id", requireRole(DASHBOARD_ROLES), controller.adminGet);
adminRouter.post("/", requireRole(WRITE_ROLES), validate(createAlbumSchema), controller.adminCreate);
adminRouter.put("/:id", requireRole(WRITE_ROLES), validate(updateAlbumSchema), controller.adminUpdate);
adminRouter.patch("/:id/status", requireRole(PUBLISH_ROLES), validate(updateStatusSchema), controller.adminUpdateStatus);
adminRouter.delete("/:id", requireRole(DELETE_ROLES), controller.adminDelete);

// Nested photo management within an album.
adminRouter.get(
  "/:id/photos",
  requireRole(DASHBOARD_ROLES),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req);
    const filter = { albumId: req.params.id };
    const [items, total] = await Promise.all([
      Photo.find(filter).sort({ sortOrder: 1 }).skip(skip).limit(limit),
      Photo.countDocuments(filter),
    ]);
    paginated(res, items, page, limit, total);
  })
);

adminRouter.post(
  "/:id/photos",
  requireRole(WRITE_ROLES),
  validate(addPhotosSchema),
  asyncHandler(async (req, res) => {
    const album = await Album.findById(req.params.id);
    if (!album) throw ApiError.notFound();

    const currentMax = await Photo.countDocuments({ albumId: album._id });
    const docs = req.body.photos.map(
      (p: { imageUrl: string; thumbnailUrl: string; mediumUrl: string; caption_en: string; caption_te: string }, i: number) => ({
        albumId: album._id,
        imageUrl: p.imageUrl,
        thumbnailUrl: p.thumbnailUrl,
        mediumUrl: p.mediumUrl,
        caption: { en: p.caption_en, te: p.caption_te },
        sortOrder: currentMax + i,
      })
    );
    const created = await Photo.insertMany(docs);
    await writeAuditLog({ req, action: "add_photos", entityType: "album", entityId: req.params.id, after: { count: created.length } });
    ok(res, created, 201);
  })
);

adminRouter.put(
  "/:id/photos/reorder",
  requireRole(WRITE_ROLES),
  validate(reorderPhotosSchema),
  asyncHandler(async (req, res) => {
    const { order } = req.body as { order: Array<{ id: string; sortOrder: number }> };
    await Promise.all(order.map((o) => Photo.updateOne({ _id: o.id, albumId: req.params.id }, { sortOrder: o.sortOrder })));
    await writeAuditLog({ req, action: "reorder_photos", entityType: "album", entityId: req.params.id });
    ok(res, { reordered: true });
  })
);

adminRouter.put(
  "/:id/photos/:photoId",
  requireRole(WRITE_ROLES),
  validate(updatePhotoSchema),
  asyncHandler(async (req, res) => {
    const { caption_en, caption_te } = req.body as { caption_en?: string; caption_te?: string };
    const update: Record<string, string> = {};
    if (caption_en !== undefined) update["caption.en"] = caption_en;
    if (caption_te !== undefined) update["caption.te"] = caption_te;

    const photo = await Photo.findOneAndUpdate({ _id: req.params.photoId, albumId: req.params.id }, update, { new: true });
    if (!photo) throw ApiError.notFound();
    ok(res, photo);
  })
);

adminRouter.delete(
  "/:id/photos/:photoId",
  requireRole(DELETE_ROLES),
  asyncHandler(async (req, res) => {
    const photo = await Photo.findOneAndDelete({ _id: req.params.photoId, albumId: req.params.id });
    if (!photo) throw ApiError.notFound();
    await writeAuditLog({ req, action: "delete_photo", entityType: "album", entityId: req.params.id, before: photo });
    ok(res, { deleted: true });
  })
);

export const albumsPublicRouter = router;
export const albumsAdminRouter = adminRouter;
