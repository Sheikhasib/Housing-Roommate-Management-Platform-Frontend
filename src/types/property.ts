import type { PropertyType, RoomStatus, RoomType } from "@/validation/enums";
import type { CloudinaryImage, PublicOwner } from "@/types/room";

/** The part of one published room that `GET /property/public` nests under a property. */
export interface PublicPropertyRoom {
  id: string;
  monthlyRent: string;
}

/** One item of `GET /property/public`. `rooms` are published rooms, cheapest first. */
export interface PublicPropertySummary {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  city: string;
  area: string | null;
  images: CloudinaryImage[] | null;
  amenities: string[] | null;
  /** Decimal(9,6) arrives as a string; null when no pin is set. */
  latitude: string | number | null;
  longitude: string | number | null;
  owner: PublicOwner;
  rooms: PublicPropertyRoom[];
  _count: { rooms: number };
}

/** The unit a room belongs to (guest view of `GET /property/:propertyId`). */
export interface PublicPropertyUnit {
  id: string;
  label: string;
  description: string | null;
  floor: number | null;
}

/**
 * One raw Room row nested in the guest property detail. It has no computed availability fields
 * (`availableBeds`, `availableNow`, `nextAvailableDate`) and no nested property.
 */
export interface PublicPropertyDetailRoom {
  id: string;
  name: string;
  description: string | null;
  type: RoomType;
  bedCount: number;
  occupiedBeds: number;
  monthlyRent: string;
  bookingDeposit: string;
  minLeaseMonths: number;
  sizeSqft: number | null;
  isFurnished: boolean;
  amenities: string[] | null;
  images: CloudinaryImage[] | null;
  availableFrom: string | null;
  status: RoomStatus;
  isPublished: boolean;
  propertyId: string;
  unitId: string | null;
  unit: PublicPropertyUnit | null;
}

/** `GET /property/:propertyId` as a guest or tenant: published rooms only, `units` always empty. */
export interface PublicPropertyDetail {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  city: string;
  area: string | null;
  address: string | null;
  googleMapUrl: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  amenities: string[] | null;
  images: CloudinaryImage[] | null;
  houseRules: string | null;
  createdAt: string;
  updatedAt: string;
  owner: PublicOwner | null;
  rooms: PublicPropertyDetailRoom[];
}

/** One item of `GET /property/my-properties` (owner) or `GET /manager/my-properties` (manager). */
export interface OwnedPropertySummary {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  city: string;
  area: string | null;
  images: CloudinaryImage[] | null;
  amenities: string[] | null;
  createdAt: string;
  _count: { rooms: number };
}

/**
 * One non-deleted unit. The `units` array is confirmed on the live detail response, but the demo
 * data has none, so the item fields follow the documented `Unit` model (backend spec 05).
 */
export interface PropertyUnit {
  id: string;
  label: string;
  description: string | null;
  floor: number | null;
  propertyId: string;
}

/** `GET /property/:propertyId` for the owning OWNER or an assigned PROPERTY_MANAGER (full view). */
export interface PropertyDetail {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  city: string;
  area: string | null;
  address: string | null;
  googleMapUrl: string | null;
  /** Decimal(9,6) arrives as a string or number; null when no pin is set. */
  latitude: string | number | null;
  longitude: string | number | null;
  amenities: string[] | null;
  images: CloudinaryImage[] | null;
  houseRules: string | null;
  createdAt: string;
  units: PropertyUnit[];
}

/** One row of `GET /property/:propertyId/managers`. */
export interface PropertyManagerRow {
  propertyId: string;
  managerId: string;
  assignedAt: string;
  manager: {
    id: string;
    name: string;
    email: string;
    contactNumber: string | null;
    bio: string | null;
    user: { imageUrl: string | null };
  };
}
