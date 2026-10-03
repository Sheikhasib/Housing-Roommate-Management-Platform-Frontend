import { z } from "zod";
import { PROPERTY_TYPES, ROOM_TYPES } from "@/validation/enums";

export const ROOMS_DEFAULT_LIMIT = 12;
export const ROOMS_LIMIT_OPTIONS = [12, 24, 48];

export const AVAILABILITY_VALUES = ["available", "upcoming", "all"] as const;
export type Availability = (typeof AVAILABILITY_VALUES)[number];

export const ROOM_SORT_FIELDS = ["monthlyRent", "createdAt"] as const;

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalText = z
  .preprocess(blankToUndefined, z.string().trim().min(1).max(100).optional())
  .catch(undefined);

const optionalRent = z
  .preprocess(blankToUndefined, z.coerce.number().min(0).max(10_000_000).optional())
  .catch(undefined);

const roomsFilterSchema = z.object({
  searchTerm: optionalText,
  city: optionalText,
  propertyType: z.enum(PROPERTY_TYPES).optional().catch(undefined),
  type: z.enum(ROOM_TYPES).optional().catch(undefined),
  minRent: optionalRent,
  maxRent: optionalRent,
  isFurnished: z
    .preprocess((value) => (value === "true" ? true : undefined), z.literal(true).optional())
    .catch(undefined),
  availability: z.enum(AVAILABILITY_VALUES).catch("available"),
  sortBy: z.enum(ROOM_SORT_FIELDS).catch("monthlyRent"),
  sortOrder: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(50).catch(ROOMS_DEFAULT_LIMIT),
});

export type RoomsFilters = z.infer<typeof roomsFilterSchema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Validates the page's URL query. Any invalid or missing value falls back to its default. */
export function parseRoomsFilters(raw: RawSearchParams): RoomsFilters {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  return roomsFilterSchema.parse({
    ...flat,
    page: flat.page ?? 1,
    limit: flat.limit ?? ROOMS_DEFAULT_LIMIT,
  });
}
