import { z } from "zod";

// Mirrors backend admin.validation.ts and owner.validation.ts (same messages).
export const UpdateUserStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], "Status must be ACTIVE or BLOCKED"),
  reason: z.string("Not a string.").optional(),
});

export const ASSIGNABLE_ROLES = ["TENANT", "OWNER", "PROPERTY_MANAGER", "ADMIN"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const UpdateUserRoleZodSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES, "Role must be TENANT, OWNER, PROPERTY_MANAGER or ADMIN"),
  reason: z.string("Not a string.").optional(),
});

export const ReviewTenantVerificationZodSchema = z
  .object({
    verificationStatus: z.enum(["APPROVED", "REJECTED"], "verificationStatus must be APPROVED or REJECTED"),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.verificationStatus === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting a tenant",
      });
    }
  });

export const VerifyOwnerZodSchema = z
  .object({
    ownerProfileId: z.string().min(1, "ownerProfileId is required"),
    verificationStatus: z.enum(["APPROVED", "REJECTED"], "verificationStatus must be APPROVED or REJECTED"),
    rejectionReason: z.string("Not a string.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.verificationStatus === "REJECTED" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting an owner",
      });
    }
  });

/** Empty optional text is left out of the request body. */
export function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
