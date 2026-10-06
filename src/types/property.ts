import type { PropertyType } from "@/validation/enums";
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
  owner: PublicOwner;
  rooms: PublicPropertyRoom[];
  _count: { rooms: number };
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
