import { z } from "zod";

import { GENDERS } from "@/validation/enums";

/** Mirrors the backend auth.validation.ts (same rules, same messages). */

export const PASSWORD_RULES = [
  { id: "length", label: "4 to 32 characters", test: (v: string) => v.length >= 4 && v.length <= 32 },
  { id: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", label: "One digit", test: (v: string) => /[0-9]/.test(v) },
  { id: "special", label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export const passwordSchema = z
  .string()
  .min(4, "Password must be at least 4 characters long")
  .max(32, "Password must be at most 32 characters long")
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one digit" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });

const emailSchema = z.email("Not a valid email address.");
const otpSchema = z.string().length(6, "OTP must be exactly 6 characters");

export const REGISTER_ROLES = ["TENANT", "OWNER", "PROPERTY_MANAGER"] as const;
export type RegisterRole = (typeof REGISTER_ROLES)[number];

export const tenantProfileSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    gender: z.enum(GENDERS, "Invalid gender.").optional(),
    occupation: z.string("Not a string.").optional(),
    preferredCity: z.string("Not a string.").optional(),
    monthlyBudgetMax: z.number("Budget must be a number.").int().positive().optional(),
    smoker: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    lookingForRoommate: z.boolean().optional(),
  })
  .optional();

export const ownerProfileSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    companyName: z.string("Not a string.").optional(),
    address: z.string("Not a string.").optional(),
  })
  .optional();

export const managerProfileSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    bio: z.string("Not a string.").optional(),
  })
  .optional();

const registerAccountShape = {
  name: z
    .string("Not a string.")
    .min(3, "Name must be at least 3 characters long")
    .max(30, "Name must be at most 30 characters long"),
  email: emailSchema,
  password: passwordSchema,
  role: z
    .enum(REGISTER_ROLES, "Role must be TENANT, OWNER or PROPERTY_MANAGER.")
    .default("TENANT"),
};

/** Step 1 of the wizard: the account fields only. */
export const registerAccountSchema = z.object(registerAccountShape);

export const registerZodSchema = z
  .object({ ...registerAccountShape, profile: z.unknown().optional() })
  .superRefine((data, ctx) => {
    const profileSchema =
      data.role === "TENANT"
        ? tenantProfileSchema
        : data.role === "OWNER"
          ? ownerProfileSchema
          : managerProfileSchema;
    const result = profileSchema.safeParse(data.profile);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
      }
    }
  });

export const verifyEmailZodSchema = z.object({ email: emailSchema, otp: otpSchema });
export const loginZodSchema = z.object({ email: emailSchema, password: passwordSchema });
export const forgotPasswordZodSchema = z.object({ email: emailSchema });
export const resetPasswordZodSchema = z.object({
  email: emailSchema,
  newPassword: passwordSchema,
  otp: otpSchema,
});
export const googleLoginZodSchema = z.object({
  idToken: z.string().min(1, "Google id token is required"),
});

export type RegisterInput = z.input<typeof registerZodSchema>;
export type TenantProfile = NonNullable<z.infer<typeof tenantProfileSchema>>;
export type OwnerProfile = NonNullable<z.infer<typeof ownerProfileSchema>>;
export type ManagerProfile = NonNullable<z.infer<typeof managerProfileSchema>>;

/** Drops empty values; returns undefined when nothing is filled so `profile` is not sent at all. */
export function compactProfile<T extends Record<string, string | number | boolean | undefined>>(
  values: T,
): Partial<T> | undefined {
  const entries = Object.entries(values).filter(
    ([, value]) => value !== undefined && value !== "" && value !== false,
  );
  return entries.length > 0 ? (Object.fromEntries(entries) as Partial<T>) : undefined;
}

/** First message per field path, for mapping a failed parse onto form fields. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !(key in result)) result[key] = issue.message;
  }
  return result;
}
