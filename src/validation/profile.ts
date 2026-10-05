import { z } from "zod";

import { GENDERS, type Gender } from "@/validation/enums";

export const BIO_MAX = 500;

// Mirrors backend user.validation.ts, tenant.validation.ts, owner.validation.ts and manager.validation.ts.
export const updateProfileZodSchema = z
  .object({
    name: z
      .string("Not a string.")
      .min(3, "Name must be at least 3 characters long")
      .max(30, "Name must be at most 30 characters long")
      .optional(),
  })
  .strict();

const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"], "Invalid gender.");

export const UpdateTenantProfileZodSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    gender: genderEnum.optional(),
    dateOfBirth: z
      .string("Not a string.")
      .datetime({ offset: true, message: "dateOfBirth must be a valid date" })
      .optional()
      .or(z.date().optional()),
    occupation: z.string("Not a string.").optional(),
    bio: z.string("Not a string.").max(BIO_MAX, "Bio must be at most 500 characters long").optional(),
    preferredCity: z.string("Not a string.").optional(),
    monthlyBudgetMax: z
      .number("Budget must be a number.")
      .int("Budget must be an integer.")
      .positive("Budget must be positive.")
      .max(1000000, "Budget seems unrealistically high.")
      .optional(),
    moveInDate: z
      .string("Not a string.")
      .datetime({ offset: true, message: "moveInDate must be a valid date" })
      .optional()
      .or(z.date().optional()),
    smoker: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    hasPets: z.boolean().optional(),
    lookingForRoommate: z.boolean().optional(),
  })
  .strict();

export const UpdateOwnerProfileZodSchema = z
  .object({
    contactNumber: z
      .string("Not a string.")
      .min(8, "Contact number must be at least 8 characters long")
      .optional(),
    companyName: z
      .string("Not a string.")
      .min(2, "Company name must be at least 2 characters long")
      .optional(),
    address: z.string("Not a string.").optional(),
  })
  .strict();

export const UpdateManagerProfileZodSchema = z
  .object({
    contactNumber: z.string("Not a string.").optional(),
    bio: z.string("Not a string.").max(BIO_MAX, "Bio must be at most 500 characters long").optional(),
  })
  .strict();

/** The backend schemas are strict and optional, so a blank input means "leave it out". */
function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** A native date input value (yyyy-mm-dd) as an ISO datetime with offset. */
function dateToIso(value: string): string | undefined {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

/** An ISO datetime from the backend as a native date input value. */
export function isoToDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export interface AccountValues {
  name: string;
}

export function toAccountPayload(value: AccountValues) {
  return { name: blankToUndefined(value.name) };
}

export interface TenantValues {
  contactNumber: string;
  gender: Gender | "";
  dateOfBirth: string;
  occupation: string;
  bio: string;
  preferredCity: string;
  monthlyBudgetMax: string;
  moveInDate: string;
  smoker: boolean;
  petFriendly: boolean;
  hasPets: boolean;
  lookingForRoommate: boolean;
}

export const TENANT_FIELDS = [
  "contactNumber",
  "gender",
  "dateOfBirth",
  "occupation",
  "bio",
  "preferredCity",
  "monthlyBudgetMax",
  "moveInDate",
  "smoker",
  "petFriendly",
  "hasPets",
  "lookingForRoommate",
] as const;

export function toTenantPayload(value: TenantValues) {
  const budget = blankToUndefined(value.monthlyBudgetMax);
  return {
    contactNumber: blankToUndefined(value.contactNumber),
    gender: value.gender && GENDERS.includes(value.gender) ? value.gender : undefined,
    dateOfBirth: dateToIso(value.dateOfBirth),
    occupation: blankToUndefined(value.occupation),
    bio: blankToUndefined(value.bio),
    preferredCity: blankToUndefined(value.preferredCity),
    monthlyBudgetMax: budget === undefined ? undefined : Number(budget),
    moveInDate: dateToIso(value.moveInDate),
    smoker: value.smoker,
    petFriendly: value.petFriendly,
    hasPets: value.hasPets,
    lookingForRoommate: value.lookingForRoommate,
  };
}

export interface OwnerValues {
  contactNumber: string;
  companyName: string;
  address: string;
}

export const OWNER_FIELDS = ["contactNumber", "companyName", "address"] as const;

export function toOwnerPayload(value: OwnerValues) {
  return {
    contactNumber: blankToUndefined(value.contactNumber),
    companyName: blankToUndefined(value.companyName),
    address: blankToUndefined(value.address),
  };
}

export interface ManagerValues {
  contactNumber: string;
  bio: string;
}

export const MANAGER_FIELDS = ["contactNumber", "bio"] as const;

export function toManagerPayload(value: ManagerValues) {
  return {
    contactNumber: blankToUndefined(value.contactNumber),
    bio: blankToUndefined(value.bio),
  };
}

/** Collects the first message per top-level field from a failed Zod parse, for TanStack Form. */
export function toFieldErrors(error: z.ZodError): { fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!(key in fields)) fields[key] = issue.message;
  }
  return { fields };
}
