import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().default("http://localhost:4000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Fully separate secrets from the admin JWT pair above — a citizen token
  // must never be verifiable by admin middleware or vice versa.
  JWT_CITIZEN_ACCESS_SECRET: z.string().min(16, "JWT_CITIZEN_ACCESS_SECRET must be at least 16 chars"),
  JWT_CITIZEN_REFRESH_SECRET: z.string().min(16, "JWT_CITIZEN_REFRESH_SECRET must be at least 16 chars"),
  JWT_CITIZEN_ACCESS_EXPIRES_IN: z.string().default("1h"),
  JWT_CITIZEN_REFRESH_EXPIRES_IN: z.string().default("30d"),

  ADMIN_ORIGIN: z.string().default("http://localhost:5173"),

  AWS_REGION: z.string().default("ap-south-1"),
  AWS_S3_BUCKET: z.string().default("vja-central-media"),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  CDN_URL: z.string().optional(),

  MAX_UPLOAD_MB: z.coerce.number().default(15),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(10),
  // Public citizen registration/login traffic is expected to be much higher
  // volume than staff admin logins, so it gets its own, more generous budget
  // rather than sharing LOGIN_RATE_LIMIT_MAX.
  CITIZEN_AUTH_RATE_LIMIT_MAX: z.coerce.number().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud — never start the API with a partially-valid config.
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
