import { z } from "zod";

import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  type MaintenanceStatus,
} from "@/validation/enums";

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

/** Mirrors the backend `UpdateMaintenanceStatusZodSchema` (spec 13), strict, same messages. */
export const UpdateMaintenanceStatusZodSchema = z
  .object({
    status: z.enum(MAINTENANCE_STATUSES, "Invalid status."),
    assignedTo: z.string("Not a string.").optional(),
    resolutionNotes: z.string("Not a string.").optional(),
  })
  .strict();

export type UpdateMaintenanceStatusPayload = z.infer<typeof UpdateMaintenanceStatusZodSchema>;

/** The forward-only workflow (spec 13). CLOSED is terminal. */
export const NEXT_STATUSES: Record<MaintenanceStatus, readonly MaintenanceStatus[]> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

/** The server's own wording for a RESOLVED request without notes. */
export const RESOLUTION_NOTES_REQUIRED = "Resolution notes are required when resolving a request";

export interface StatusFormValues {
  assignedTo: string;
  resolutionNotes: string;
}

/**
 * The payload for a move. Empty text is left out: an empty `assignedTo` lets the server pick its
 * default, and notes are sent only when written. `assignedTo` is sent only when moving to ASSIGNED.
 */
export function buildStatusPayload(status: MaintenanceStatus, values: StatusFormValues) {
  const assignedTo = values.assignedTo.trim();
  const resolutionNotes = values.resolutionNotes.trim();
  return {
    status,
    ...(status === "ASSIGNED" && assignedTo ? { assignedTo } : {}),
    ...(resolutionNotes ? { resolutionNotes } : {}),
  };
}

export type StatusField = keyof StatusFormValues;

/** Strict schema plus the client rule: RESOLVED needs notes. Returns the first message per field. */
export function validateStatusForm(
  status: MaintenanceStatus,
  values: StatusFormValues,
): Partial<Record<StatusField, string>> {
  const errors: Partial<Record<StatusField, string>> = {};
  if (status === "RESOLVED" && !values.resolutionNotes.trim()) {
    errors.resolutionNotes = RESOLUTION_NOTES_REQUIRED;
  }
  const result = UpdateMaintenanceStatusZodSchema.safeParse(buildStatusPayload(status, values));
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if ((key === "assignedTo" || key === "resolutionNotes") && !(key in errors)) {
        errors[key] = issue.message;
      }
    }
  }
  return errors;
}
