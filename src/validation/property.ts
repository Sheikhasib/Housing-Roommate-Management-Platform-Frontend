import { z } from "zod";

import { PROPERTY_TYPES, type PropertyType } from "@/validation/enums";

// Mirrors backend property.validation.ts (spec 05). Update is .strict(): send only listed keys.
const PropertyTypeEnum = z.enum(PROPERTY_TYPES, "Invalid property type.");

export const UpdatePropertyZodSchema = z
  .object({
    title: z.string("Not a string.").min(3, "Title too short").optional(),
    description: z.string("Not a string.").max(2000, "Description too long").optional(),
    type: PropertyTypeEnum.optional(),
    city: z.string("Not a string.").min(2, "City is required").optional(),
    area: z.string("Not a string.").optional(),
    address: z.string("Not a string.").optional(),
    googleMapUrl: z.string("Not a string.").optional().or(z.literal("")),
    latitude: z
      .number("Latitude must be a number.")
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .nullable()
      .optional(),
    longitude: z
      .number("Longitude must be a number.")
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .nullable()
      .optional(),
    amenities: z.array(z.string(), "amenities must be an array of strings").optional(),
    houseRules: z.string("Not a string.").optional(),
  })
  .strict();

export const AssignManagerZodSchema = z.object({
  managerEmail: z.email("managerEmail must be a valid email"),
});

// Create is not strict (unknown keys are stripped); latitude and longitude are omit-only here.
export const CreatePropertyZodSchema = z.object({
  title: z
    .string("Not a string.")
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must be at most 100 characters long"),
  description: z
    .string("Not a string.")
    .max(2000, "Description must be at most 2000 characters long")
    .optional(),
  type: PropertyTypeEnum.optional(),
  city: z.string("Not a string.").min(2, "City is required"),
  area: z.string("Not a string.").optional(),
  address: z.string("Not a string.").optional(),
  googleMapUrl: z
    .string("Not a string.")
    .url("googleMapUrl must be a valid URL")
    .optional()
    .or(z.literal("")),
  latitude: z
    .number("Latitude must be a number.")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number("Longitude must be a number.")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  amenities: z.array(z.string(), "amenities must be an array of strings").optional(),
  houseRules: z.string("Not a string.").optional(),
});

export type CreatePropertyPayload = z.infer<typeof CreatePropertyZodSchema>;

export const CreateUnitZodSchema = z.object({
  label: z
    .string("Not a string.")
    .min(1, "Unit label is required")
    .max(50, "Unit label must be at most 50 characters"),
  description: z.string("Not a string.").optional(),
  floor: z
    .number("Floor must be a number.")
    .int()
    .min(-2, "Floor must be -2 or above")
    .max(200, "Floor seems too high")
    .optional(),
});

export const UpdateUnitZodSchema = z
  .object({
    label: z.string("Not a string.").min(1, "Unit label is required").optional(),
    description: z.string("Not a string.").optional(),
    floor: z.number("Floor must be a number.").int().optional(),
  })
  .strict();

export type CreateUnitPayload = z.infer<typeof CreateUnitZodSchema>;

export const UNIT_FIELDS = ["label", "description", "floor"] as const;

/** Text-only unit form state: the floor is parsed to a number when the form is sent. */
export interface UnitValues {
  label: string;
  description: string;
  floor: string;
}

export const EMPTY_UNIT_VALUES: UnitValues = { label: "", description: "", floor: "" };

function toFloor(text: string): number {
  // A non-number stays NaN so the schema reports "Floor must be a number."
  return Number(text.trim());
}

/** Create: blank optional fields are left out. */
export function toUnitCreatePayload(values: UnitValues): Record<string, unknown> {
  const payload: Record<string, unknown> = { label: values.label.trim() };
  if (values.description.trim()) payload.description = values.description.trim();
  if (values.floor.trim()) payload.floor = toFloor(values.floor);
  return payload;
}

/**
 * Update: only the changed keys. The backend cannot clear a floor (no null), so an emptied floor
 * is left out and the stored value stays.
 */
export function toUnitUpdatePayload(value: UnitValues, initial: UnitValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (value.label.trim() !== initial.label.trim()) payload.label = value.label.trim();
  if (value.description.trim() !== initial.description.trim()) {
    payload.description = value.description.trim();
  }
  if (value.floor.trim() !== initial.floor.trim() && value.floor.trim() !== "") {
    payload.floor = toFloor(value.floor);
  }
  return payload;
}

/** The property form fields held by the create wizard draft. Nothing else is ever persisted. */
export interface WizardDetails {
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  area: string;
  address: string;
  googleMapUrl: string;
  latitude: string;
  longitude: string;
  amenities: string[];
  houseRules: string;
}

export const EMPTY_WIZARD_DETAILS: WizardDetails = {
  title: "",
  description: "",
  type: "APARTMENT",
  city: "",
  area: "",
  address: "",
  googleMapUrl: "",
  latitude: "",
  longitude: "",
  amenities: [],
  houseRules: "",
};

/** Blank optional fields are left out, so create never sends empty strings or null coordinates. */
export function toCreatePropertyPayload(details: WizardDetails): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: details.title.trim(),
    city: details.city.trim(),
    type: details.type,
  };
  const optional = ["description", "area", "address", "googleMapUrl", "houseRules"] as const;
  for (const key of optional) {
    if (details[key].trim()) payload[key] = details[key].trim();
  }
  if (details.latitude.trim()) payload.latitude = Number(details.latitude.trim());
  if (details.longitude.trim()) payload.longitude = Number(details.longitude.trim());
  if (details.amenities.length > 0) payload.amenities = details.amenities;
  return payload;
}

export const PROPERTY_FIELDS = [
  "title",
  "description",
  "type",
  "city",
  "area",
  "address",
  "googleMapUrl",
  "latitude",
  "longitude",
  "amenities",
  "houseRules",
] as const;

/** Text-only form state: numbers and the amenity list are parsed when the form is sent. */
export interface PropertyValues {
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  area: string;
  address: string;
  googleMapUrl: string;
  latitude: string;
  longitude: string;
  amenities: string;
  houseRules: string;
}

export function splitAmenities(text: string): string[] {
  return [...new Set(text.split(",").map((item) => item.trim()).filter(Boolean))];
}

function toCoordinate(text: string): number | null {
  const trimmed = text.trim();
  // A non-number stays NaN so the schema reports "Latitude must be a number."
  return trimmed === "" ? null : Number(trimmed);
}

/** Only the keys that changed, so a manager or owner never overwrites untouched fields. */
export function toPropertyPayload(value: PropertyValues, initial: PropertyValues) {
  const payload: Record<string, unknown> = {};
  const text = ["title", "description", "city", "area", "address", "googleMapUrl", "houseRules"] as const;
  for (const key of text) {
    if (value[key].trim() !== initial[key].trim()) payload[key] = value[key].trim();
  }
  if (value.type !== initial.type) payload.type = value.type;
  if (value.latitude.trim() !== initial.latitude.trim()) payload.latitude = toCoordinate(value.latitude);
  if (value.longitude.trim() !== initial.longitude.trim()) payload.longitude = toCoordinate(value.longitude);
  if (value.amenities.trim() !== initial.amenities.trim()) payload.amenities = splitAmenities(value.amenities);
  return payload;
}

export function toFieldErrors(error: z.ZodError): { fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const name = String(issue.path[0] ?? "");
    if (name && !(name in fields)) fields[name] = issue.message;
  }
  return { fields };
}
