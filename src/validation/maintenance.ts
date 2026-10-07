import { z } from "zod";

import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES } from "@/validation/enums";

/** Mirrors the backend `CreateMaintenanceRequestZodSchema` (spec 13), same rules and messages. */
export const CreateMaintenanceRequestZodSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  category: z.enum(MAINTENANCE_CATEGORIES, "Invalid category.").optional(),
  priority: z.enum(MAINTENANCE_PRIORITIES, "Invalid priority.").optional(),
  title: z
    .string("Not a string.")
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string("Not a string.")
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

export type CreateMaintenancePayload = z.infer<typeof CreateMaintenanceRequestZodSchema>;

export const DESCRIPTION_LIMIT = 1000;

export interface CreateMaintenanceFormValues {
  roomId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
}

export type CreateMaintenanceField = keyof CreateMaintenanceFormValues;

const ROOM_REQUIRED_TEXT = "Choose the room this problem is in.";

/** The form holds strings; the payload leaves the description out when it is empty. */
export function buildCreateMaintenancePayload(values: CreateMaintenanceFormValues) {
  const description = values.description.trim();
  return {
    roomId: values.roomId,
    category: values.category,
    priority: values.priority,
    title: values.title.trim(),
    ...(description ? { description } : {}),
  };
}

/** The typed payload, or null when the form values do not pass the schema. */
export function toCreateMaintenancePayload(
  values: CreateMaintenanceFormValues,
): CreateMaintenancePayload | null {
  const result = CreateMaintenanceRequestZodSchema.safeParse(buildCreateMaintenancePayload(values));
  return result.success ? result.data : null;
}

/** Runs the mirrored schema and returns the first message per field. */
export function validateCreateMaintenanceForm(
  values: CreateMaintenanceFormValues,
): Partial<Record<CreateMaintenanceField, string>> {
  const result = CreateMaintenanceRequestZodSchema.safeParse(buildCreateMaintenancePayload(values));
  if (result.success) return {};
  const errors: Partial<Record<CreateMaintenanceField, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && key in values && !(key in errors)) {
      errors[key as CreateMaintenanceField] = issue.message;
    }
  }
  if (errors.roomId) errors.roomId = ROOM_REQUIRED_TEXT;
  return errors;
}
