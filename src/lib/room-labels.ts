import type { PropertyType, RoomType } from "@/validation/enums";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  PRIVATE_ROOM: "Private room",
  SHARED_ROOM: "Shared room",
  ENTIRE_FLAT: "Entire flat",
  BED: "Bed",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOSTEL: "Hostel",
  DORMITORY: "Dormitory",
  VILLA: "Villa",
  SHARED_HOUSE: "Shared house",
  OTHER: "Other",
};
