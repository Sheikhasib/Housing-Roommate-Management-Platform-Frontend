import { z } from "zod";
import { PROPERTY_TYPES } from "@/validation/enums";
import type { RawSearchParams } from "@/validation/rooms-filter";

export const PROPERTIES_DEFAULT_LIMIT = 12;
export const PROPERTIES_LIMIT_OPTIONS = [12, 24, 48];

export const PROPERTY_SORT_FIELDS = ["createdAt", "title"] as const;

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalText = z
  .preprocess(blankToUndefined, z.string().trim().min(1).max(100).optional())
  .catch(undefined);

const propertiesFilterSchema = z.object({
  searchTerm: optionalText,
  city: optionalText,
  type: z.enum(PROPERTY_TYPES).optional().catch(undefined),
  sortBy: z.enum(PROPERTY_SORT_FIELDS).catch("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(50).catch(PROPERTIES_DEFAULT_LIMIT),
});

export type PropertiesFilters = z.infer<typeof propertiesFilterSchema>;

/** Validates the page's URL query. Any invalid or missing value falls back to its default. */
export function parsePropertiesFilters(raw: RawSearchParams): PropertiesFilters {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  return propertiesFilterSchema.parse({
    ...flat,
    page: flat.page ?? 1,
    limit: flat.limit ?? PROPERTIES_DEFAULT_LIMIT,
  });
}
