import { connectDB, disconnectDB } from "@/config/db";
import { GrievanceCategory } from "@/models/GrievanceCategory";
import { Department } from "@/models/Department";
import { logger } from "@/config/logger";

// The exact category/sub-category taxonomy from §8 of the Praja Samvad
// spec — seeded into the database (not hard-coded in the client) so an
// admin can add/rename a sub-category later without a code deploy.
const CATEGORIES: Array<{
  name_en: string;
  name_te: string;
  slug: string;
  isOther?: boolean;
  subCategories: Array<{ name_en: string; name_te: string; slug: string }>;
}> = [
  {
    name_en: "Civic",
    name_te: "పౌర సేవలు",
    slug: "civic",
    subCategories: [
      { name_en: "Roads", name_te: "రోడ్లు", slug: "roads" },
      { name_en: "Drainage", name_te: "డ్రైనేజీ", slug: "drainage" },
      { name_en: "Street Lights", name_te: "వీధి దీపాలు", slug: "street-lights" },
      { name_en: "Water", name_te: "నీరు", slug: "water" },
      { name_en: "Garbage", name_te: "చెత్త", slug: "garbage" },
      { name_en: "Parks", name_te: "పార్కులు", slug: "parks" },
      { name_en: "Footpaths", name_te: "ఫుట్‌పాత్‌లు", slug: "footpaths" },
      { name_en: "Traffic", name_te: "ట్రాఫిక్", slug: "traffic" },
    ],
  },
  {
    name_en: "Government Services",
    name_te: "ప్రభుత్వ సేవలు",
    slug: "government-services",
    subCategories: [
      { name_en: "Pensions", name_te: "పెన్షన్లు", slug: "pensions" },
      { name_en: "Ration Cards", name_te: "రేషన్ కార్డులు", slug: "ration-cards" },
      { name_en: "Housing", name_te: "గృహనిర్మాణం", slug: "housing" },
      { name_en: "Certificates", name_te: "సర్టిఫికెట్లు", slug: "certificates" },
      { name_en: "Welfare Schemes", name_te: "సంక్షేమ పథకాలు", slug: "welfare-schemes" },
      { name_en: "Government Benefits", name_te: "ప్రభుత్వ ప్రయోజనాలు", slug: "government-benefits" },
    ],
  },
  {
    name_en: "Health",
    name_te: "ఆరోగ్యం",
    slug: "health",
    subCategories: [
      { name_en: "Hospitals", name_te: "ఆసుపత్రులు", slug: "hospitals" },
      { name_en: "Medical Assistance", name_te: "వైద్య సహాయం", slug: "medical-assistance" },
      { name_en: "Ambulance", name_te: "అంబులెన్స్", slug: "ambulance" },
      { name_en: "Health Schemes", name_te: "ఆరోగ్య పథకాలు", slug: "health-schemes" },
    ],
  },
  {
    name_en: "Education",
    name_te: "విద్య",
    slug: "education",
    subCategories: [
      { name_en: "Schools", name_te: "పాఠశాలలు", slug: "schools" },
      { name_en: "Scholarships", name_te: "స్కాలర్‌షిప్‌లు", slug: "scholarships" },
      { name_en: "Infrastructure", name_te: "మౌలిక సదుపాయాలు", slug: "infrastructure" },
      { name_en: "Student Issues", name_te: "విద్యార్థుల సమస్యలు", slug: "student-issues" },
    ],
  },
  {
    name_en: "Employment",
    name_te: "ఉపాధి",
    slug: "employment",
    subCategories: [
      { name_en: "Job Opportunities", name_te: "ఉద్యోగ అవకాశాలు", slug: "job-opportunities" },
      { name_en: "Skill Development", name_te: "నైపుణ్యాభివృద్ధి", slug: "skill-development" },
      { name_en: "Local Employment", name_te: "స్థానిక ఉపాధి", slug: "local-employment" },
    ],
  },
  {
    name_en: "Individual",
    name_te: "వ్యక్తిగత",
    slug: "individual",
    subCategories: [
      { name_en: "Land / Property", name_te: "భూమి / ఆస్తి", slug: "land-property" },
      { name_en: "Family Issues", name_te: "కుటుంబ సమస్యలు", slug: "family-issues" },
      { name_en: "Financial Assistance", name_te: "ఆర్థిక సహాయం", slug: "financial-assistance" },
      { name_en: "Other Petitions", name_te: "ఇతర విన్నపాలు", slug: "other-petitions" },
    ],
  },
  {
    name_en: "Others",
    name_te: "ఇతరాలు",
    slug: "others",
    isOther: true,
    subCategories: [],
  },
];

const DEFAULT_DEPARTMENTS: Array<{ name_en: string; name_te: string }> = [
  { name_en: "Municipal Corporation", name_te: "మునిసిపల్ కార్పొరేషన్" },
  { name_en: "Public Health Department", name_te: "ప్రజారోగ్య శాఖ" },
  { name_en: "Revenue Department", name_te: "రెవెన్యూ శాఖ" },
  { name_en: "Education Department", name_te: "విద్యా శాఖ" },
  { name_en: "Water Works Department", name_te: "నీటి సరఫరా శాఖ" },
  { name_en: "General Administration", name_te: "సాధారణ పరిపాలన" },
];

async function seedGrievanceConfig(): Promise<void> {
  await connectDB();

  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await GrievanceCategory.updateOne(
      { slug: c.slug },
      {
        $setOnInsert: {
          name: { en: c.name_en, te: c.name_te },
          slug: c.slug,
          isOther: c.isOther ?? false,
          subCategories: c.subCategories.map((s) => ({ name: { en: s.name_en, te: s.name_te }, slug: s.slug })),
          isActive: true,
          sortOrder: i,
        },
      },
      { upsert: true }
    );
  }
  logger.info(`Seeded ${CATEGORIES.length} grievance categories`);

  for (const d of DEFAULT_DEPARTMENTS) {
    await Department.updateOne({ "name.en": d.name_en }, { $setOnInsert: { name: { en: d.name_en, te: d.name_te }, isActive: true } }, { upsert: true });
  }
  logger.info(`Seeded ${DEFAULT_DEPARTMENTS.length} departments`);

  await disconnectDB();
}

seedGrievanceConfig()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Grievance config seed failed", { err });
    process.exit(1);
  });
