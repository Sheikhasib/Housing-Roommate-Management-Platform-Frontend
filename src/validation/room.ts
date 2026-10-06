import { z } from "zod";

import { ROOM_STATUSES, ROOM_TYPES, type RoomType } from "@/validation/enums";

// Mirrors backend room.validation.ts (spec 06), same messages. Update and availability are .strict().
const RoomTypeEnum = z.enum(ROOM_TYPES, "Invalid room type.");
const RoomStatusEnum = z.enum(ROOM_STATUSES, "Invalid room status.");

export const CreateRoomZodSchema = z.object({
  propertyId: z.string().min(1, "propertyId is required"),
  unitId: z.string().optional(),
  name: z
    .string("Not a string.")
    .min(1, "Room name is required")
    .max(50, "Room name must be at most 50 characters"),
  description: z.string("Not a string.").optional(),
  type: RoomTypeEnum.optional(),
  bedCount: z
    .number("bedCount must be a number.")
    .int("bedCount must be an integer.")
    .min(1, "A room must have at least one bed")
    .max(8, "A room can have at most 8 beds")
    .optional(),
  monthlyRent: z.number("monthlyRent must be a number.").positive("monthlyRent must be positive"),
  bookingDeposit: z
    .number("bookingDeposit must be a number.")
    .nonnegative("bookingDeposit cannot be negative")
    .optional(),
  minLeaseMonths: z
    .number("minLeaseMonths must be a number.")
    .int()
    .min(1, "minLeaseMonths must be at least 1")
    .max(60, "minLeaseMonths cannot exceed 60")
    .optional(),
  sizeSqft: z
    .number("sizeSqft must be a number.")
    .int()
    .positive("sizeSqft must be positive")
    .optional(),
  isFurnished: z.boolean().optional(),
  amenities: z.array(z.string(), "amenities must be an array of strings").optional(),
  availableFrom: z
    .string("Not a string.")
    .datetime({ offset: true, message: "availableFrom must be a valid date" })
    .optional(),
});

export type CreateRoomPayload = z.infer<typeof CreateRoomZodSchema>;

export const UpdateRoomZodSchema = z
  .object({
    name: z
      .string("Not a string.")
      .min(1, "Room name is required")
      .max(50, "Room name must be at most 50 characters")
      .optional(),
    description: z.string("Not a string.").optional(),
    type: RoomTypeEnum.optional(),
    bedCount: z.number("bedCount must be a number.").int().min(1).optional(),
    monthlyRent: z
      .number("monthlyRent must be a number.")
      .positive("monthlyRent must be positive")
      .optional(),
    bookingDeposit: z
      .number("bookingDeposit must be a number.")
      .nonnegative("bookingDeposit cannot be negative")
      .optional(),
    minLeaseMonths: z.number("minLeaseMonths must be a number.").int().min(1).optional(),
    sizeSqft: z.number("sizeSqft must be a number.").int().positive().optional(),
    isFurnished: z.boolean().optional(),
    amenities: z.array(z.string(), "amenities must be an array of strings").optional(),
  })
  .strict();

export const SetRoomAvailabilityZodSchema = z
  .object({
    status: RoomStatusEnum.optional(),
    isPublished: z.boolean().optional(),
    availableFrom: z
      .string("Not a string.")
      .datetime({ offset: true, message: "availableFrom must be a valid date" })
      .optional(),
  })
  .strict();

/** Fields of the details form, kept as text so a blank input is told apart from 0. */
export interface RoomDetailsValues {
  name: string;
  type: RoomType;
  description: string;
  monthlyRent: string;
  bookingDeposit: string;
  bedCount: string;
  sizeSqft: string;
  minLeaseMonths: string;
  isFurnished: boolean;
  amenities: string[];
}

/** Create form state: the details plus where the room lives and when it opens. */
export interface RoomCreateValues extends RoomDetailsValues {
  propertyId: string;
  unitId: string;
  availableFrom: string;
}

export const EMPTY_ROOM_CREATE_VALUES: RoomCreateValues = {
  propertyId: "",
  unitId: "",
  name: "",
  type: "PRIVATE_ROOM",
  description: "",
  monthlyRent: "",
  bookingDeposit: "",
  bedCount: "",
  sizeSqft: "",
  minLeaseMonths: "",
  isFurnished: false,
  amenities: [],
  availableFrom: "",
};

export const ROOM_CREATE_FIELDS = [
  "propertyId",
  "unitId",
  "name",
  "type",
  "description",
  "monthlyRent",
  "bookingDeposit",
  "bedCount",
  "sizeSqft",
  "minLeaseMonths",
  "isFurnished",
  "amenities",
  "availableFrom",
] as const;

export const ROOM_DETAIL_FIELDS = ROOM_CREATE_FIELDS.filter(
  (field) => field !== "propertyId" && field !== "unitId" && field !== "availableFrom",
);

// A non-number stays NaN so the schema reports "<field> must be a number."
function toNumber(text: string): number {
  return Number(text.trim());
}

/** A date input value (YYYY-MM-DD) as an ISO string with offset: local midnight. */
export function dateInputToIso(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString();
}

/** An ISO string as a date input value in local time, or "" when empty or invalid. */
export function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Create: blank optional fields are left out so the backend defaults apply. */
export function toCreateRoomPayload(values: RoomCreateValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    propertyId: values.propertyId,
    name: values.name.trim(),
    type: values.type,
    monthlyRent: toNumber(values.monthlyRent),
    isFurnished: values.isFurnished,
  };
  if (values.unitId) payload.unitId = values.unitId;
  if (values.description.trim()) payload.description = values.description.trim();
  if (values.bookingDeposit.trim()) payload.bookingDeposit = toNumber(values.bookingDeposit);
  if (values.bedCount.trim()) payload.bedCount = toNumber(values.bedCount);
  if (values.sizeSqft.trim()) payload.sizeSqft = toNumber(values.sizeSqft);
  if (values.minLeaseMonths.trim()) payload.minLeaseMonths = toNumber(values.minLeaseMonths);
  if (values.amenities.length > 0) payload.amenities = values.amenities;
  if (values.availableFrom) payload.availableFrom = dateInputToIso(values.availableFrom);
  return payload;
}

/**
 * Update: only the changed keys. A number emptied in the form is left out because the backend has
 * no way to clear it (no null).
 */
export function toUpdateRoomPayload(
  value: RoomDetailsValues,
  initial: RoomDetailsValues,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (value.name.trim() !== initial.name.trim()) payload.name = value.name.trim();
  if (value.description.trim() !== initial.description.trim()) {
    payload.description = value.description.trim();
  }
  if (value.type !== initial.type) payload.type = value.type;
  if (value.isFurnished !== initial.isFurnished) payload.isFurnished = value.isFurnished;

  const numbers = ["monthlyRent", "bookingDeposit", "bedCount", "sizeSqft", "minLeaseMonths"] as const;
  for (const key of numbers) {
    const text = value[key].trim();
    if (text !== initial[key].trim() && text !== "") payload[key] = toNumber(text);
  }

  const sameAmenities =
    value.amenities.length === initial.amenities.length &&
    value.amenities.every((tag, index) => tag === initial.amenities[index]);
  if (!sameAmenities) payload.amenities = value.amenities;
  return payload;
}
