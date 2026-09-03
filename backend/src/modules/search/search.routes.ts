import { Router } from "express";
import { Model } from "mongoose";
import { Activity } from "@/models/Activity";
import { Event } from "@/models/Event";
import { News } from "@/models/News";
import { Announcement } from "@/models/Announcement";
import { Album } from "@/models/Album";
import { Video } from "@/models/Video";
import { asyncHandler } from "@/common/asyncHandler";
import { ok, ApiError } from "@/common/apiResponse";

// Cast to a common shape for this module only — each model still has its
// own fully-typed schema everywhere else; here we just need find/count on
// documents that share status/title/publishAt-ish fields.
const SEARCHABLE: Record<string, Model<Record<string, unknown>>> = {
  activity: Activity as unknown as Model<Record<string, unknown>>,
  event: Event as unknown as Model<Record<string, unknown>>,
  news: News as unknown as Model<Record<string, unknown>>,
  announcement: Announcement as unknown as Model<Record<string, unknown>>,
  photo: Album as unknown as Model<Record<string, unknown>>, // photo search happens at the album level — see docs/API.md
  video: Video as unknown as Model<Record<string, unknown>>,
};

type SearchType = "activity" | "event" | "news" | "announcement" | "photo" | "video";

export const searchRouter = Router();

searchRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) throw ApiError.badRequest("Query parameter 'q' is required");

    const requestedType = req.query.type as SearchType | undefined;
    const types: SearchType[] = requestedType && requestedType in SEARCHABLE ? [requestedType] : (Object.keys(SEARCHABLE) as SearchType[]);

    const results = await Promise.all(
      types.map(async (type) => {
        const model = SEARCHABLE[type];
        const filter: Record<string, unknown> = { status: "published", $text: { $search: q } };
        if (req.query.category && type !== "announcement") filter.category = req.query.category;
        if (req.query.from || req.query.to) {
          const dateField = type === "event" || type === "activity" ? "date" : "publishAt";
          filter[dateField] = {
            ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
            ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}),
          };
        }

        const items = await model.find(filter).limit(20).exec();
        return { type, items };
      })
    );

    ok(res, results);
  })
);
