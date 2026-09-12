import { Router } from "express";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";
import { requireCitizenAuth } from "@/middleware/citizenAuth";
import { createImageUploadMulter, processAndUploadImage } from "@/common/imageUpload";

// Citizens need their own upload path — the existing /admin/media/upload
// endpoint requires staff WRITE_ROLES and is not reachable by a citizen
// token. Gated behind citizen auth (not fully anonymous) rather than the
// admin RBAC, but reuses the exact same validated image pipeline.
const upload = createImageUploadMulter({ maxFiles: 5 });

const router = Router();
router.use(requireCitizenAuth);

router.post(
  "/",
  upload.array("files", 5),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw ApiError.badRequest("No files uploaded");

    const results = await Promise.all(files.map((f) => processAndUploadImage(f.buffer, f.originalname)));
    ok(res, results, 201);
  })
);

export const grievanceAttachmentsRouter = router;
