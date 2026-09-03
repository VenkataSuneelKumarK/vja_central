import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "@/config/db";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { logger } from "@/config/logger";

const DEFAULT_CATEGORIES: Array<{ name_en: string; name_te: string; slug: string; appliesTo: string[] }> = [
  { name_en: "Public Activities", name_te: "ప్రజా కార్యక్రమాలు", slug: "public-activities", appliesTo: ["activity"] },
  { name_en: "Community Activities", name_te: "సామాజిక కార్యక్రమాలు", slug: "community-activities", appliesTo: ["activity"] },
  { name_en: "Development Updates", name_te: "అభివృద్ధి వార్తలు", slug: "development-updates", appliesTo: ["activity", "news"] },
  { name_en: "Meetings", name_te: "సమావేశాలు", slug: "meetings", appliesTo: ["activity", "event"] },
  { name_en: "News", name_te: "వార్తలు", slug: "news", appliesTo: ["news"] },
];

async function seed(): Promise<void> {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@vjacentral.example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({ name: "Super Admin", email: adminEmail, passwordHash, role: "super_admin" });
    logger.info(`Seeded super admin: ${adminEmail} (change this password immediately in production)`);
  } else {
    logger.info("Super admin already exists, skipping");
  }

  for (const c of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { slug: c.slug },
      { $setOnInsert: { name: { en: c.name_en, te: c.name_te }, slug: c.slug, appliesTo: c.appliesTo, isActive: true } },
      { upsert: true }
    );
  }
  logger.info(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);

  await disconnectDB();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Seed failed", { err });
    process.exit(1);
  });
