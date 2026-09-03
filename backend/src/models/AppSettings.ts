import { Schema, model, Document } from "mongoose";

// A singleton document (_id fixed to "app_settings") holding everything the
// brief requires to be replaceable without an app architecture change —
// logo, colors, splash — so a rebrand never touches application code (§26).
export interface IAppSettings extends Document<string> {
  _id: string;
  logoUrl?: string;
  profileImageUrl?: string;
  splashImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks: { facebook?: string; twitter?: string; instagram?: string; youtube?: string };
  privacyPolicyUrl?: string;
  termsUrl?: string;
  updatedAt: Date;
}

const appSettingsSchema = new Schema<IAppSettings>(
  {
    _id: { type: String, default: "app_settings" },
    logoUrl: { type: String },
    profileImageUrl: { type: String },
    splashImageUrl: { type: String },
    primaryColor: { type: String, default: "#2563EB" },
    secondaryColor: { type: String, default: "#1E3A8A" },
    contactPhone: { type: String },
    contactEmail: { type: String },
    contactAddress: { type: String },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      youtube: { type: String },
    },
    privacyPolicyUrl: { type: String },
    termsUrl: { type: String },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const AppSettings = model<IAppSettings>("AppSettings", appSettingsSchema);
