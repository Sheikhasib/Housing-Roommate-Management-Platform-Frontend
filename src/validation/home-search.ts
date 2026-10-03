import { z } from "zod";
import { ROOM_TYPES } from "@/validation/enums";

/** The Home hero search. Every field is optional; blank fields are left out of the /rooms URL. */
export const homeSearchSchema = z.object({
  searchTerm: z.string().trim().max(100, "Use 100 characters or fewer"),
  city: z.string().trim().max(100, "Use 100 characters or fewer"),
  type: z.union([z.enum(ROOM_TYPES), z.literal("")]),
  maxRent: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 10_000_000),
      "Enter the rent as a number, for example 15000",
    ),
});

export type HomeSearchValues = z.infer<typeof homeSearchSchema>;

/** Builds the `/rooms` link for a validated search, sending only the filled-in fields. */
export function buildRoomsSearchHref(values: HomeSearchValues): string {
  const params = new URLSearchParams();
  if (values.searchTerm) params.set("searchTerm", values.searchTerm);
  if (values.city) params.set("city", values.city);
  if (values.type) params.set("type", values.type);
  if (values.maxRent) params.set("maxRent", values.maxRent);
  const query = params.toString();
  return query ? `/rooms?${query}` : "/rooms";
}
