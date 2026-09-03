import { Schema } from "mongoose";
import { CONTENT_STATUSES } from "./constants";

// Every citizen-facing text field is bilingual (§27 of the brief).
// `en` is required so the app always has a fallback; `te` is optional so
// admins aren't blocked from saving a draft before translating.
export function bilingualField(required = true) {
  return {
    en: { type: String, required, trim: true },
    te: { type: String, trim: true, default: "" },
  };
}

// Shared publish-workflow fields reused by every content type
// (Activity, Event, News, Album, Video, Announcement).
export const publishFields = {
  status: { type: String, enum: CONTENT_STATUSES, default: "draft", index: true },
  publishAt: { type: Date, default: null, index: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
};

export const geoField = {
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
};

export const mediaItemSchema = new Schema(
  {
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    mediumUrl: { type: String },
    type: { type: String, enum: ["image", "video"], default: "image" },
    caption_en: { type: String, default: "" },
    caption_te: { type: String, default: "" },
  },
  { _id: false }
);
