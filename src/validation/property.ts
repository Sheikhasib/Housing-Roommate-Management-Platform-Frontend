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
