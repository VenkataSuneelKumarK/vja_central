import { z } from "zod";

// Standard Indian mobile number: 10 digits, starting 6-9 (optionally
// prefixed with +91 or 0, which we normalize away before storage).
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const registerSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30)
        .regex(/^[a-zA-Z0-9_.]+$/, "Username may only contain letters, numbers, underscore and dot"),
      mobile: z.string().transform(normalizeIndianMobile).pipe(z.string().regex(INDIAN_MOBILE_REGEX, "Enter a valid 10-digit Indian mobile number")),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
      fullName: z.string().trim().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Username or mobile number is required"),
    password: z.string().min(1, "Password is required"),
  }),
});
