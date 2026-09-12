import { Router } from "express";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireAuth } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { WRITE_ROLES } from "@/common/constants";
import { createImageUploadMulter, processAndUploadImage } from "@/common/imageUpload";

const upload = createImageUploadMulter({ maxFiles: 20 });

const router = Router();
router.use(requireAuth, requireRole(WRITE_ROLES));

router.post(
  "/upload",
  upload.array("files", 20),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw ApiError.badRequest("No files uploaded");

    const results = await Promise.all(files.map((f) => processAndUploadImage(f.buffer, f.originalname)));
    ok(res, results, 201);
  })
);

export const mediaAdminRouter = router;
