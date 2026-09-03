import { Schema, model, Document, Types } from "mongoose";

export interface IPhoto extends Document {
  _id: Types.ObjectId;
  albumId: Types.ObjectId;
  imageUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  caption: { en: string; te: string };
  sortOrder: number;
  createdAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    albumId: { type: Schema.Types.ObjectId, ref: "Album", required: true, index: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    mediumUrl: { type: String, required: true },
    caption: {
      en: { type: String, default: "" },
      te: { type: String, default: "" },
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

photoSchema.index({ albumId: 1, sortOrder: 1 });

export const Photo = model<IPhoto>("Photo", photoSchema);
