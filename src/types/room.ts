import type { PropertyType, RoomStatus, RoomType } from "@/validation/enums";

export interface CloudinaryImage {
  url: string;
  publicId: string;
}

export interface PublicRoomProperty {
  id: string;
  title: string;
  type: PropertyType;
  city: string;
  area: string | null;
  images: CloudinaryImage[] | null;
}

/** One item of `GET /room/public`. Money fields arrive as strings. */
export interface PublicRoom {
  id: string;
  name: string;
  description: string | null;
  type: RoomType;
  status: RoomStatus;
  bedCount: number;
  occupiedBeds: number;
  availableBeds: number;
  monthlyRent: string;
  isFurnished: boolean;
  images: CloudinaryImage[] | null;
  availableNow: boolean;
  nextAvailableDate: string | null;
  property: PublicRoomProperty;
}

export interface PublicOwner {
  id: string;
  name: string;
  companyName: string | null;
  user: { imageUrl: string | null } | null;
}

export interface RoomDetailProperty extends PublicRoomProperty {
  owner: PublicOwner;
}

/** `GET /room/:roomId` as a guest. Money fields arrive as strings. */
export interface RoomDetail extends Omit<PublicRoom, "property"> {
  bookingDeposit: string;
  minLeaseMonths: number;
  sizeSqft: number | null;
  amenities: string[] | null;
  availableFrom: string | null;
  /** The room row carries it; guests only ever receive published rooms. */
  isPublished?: boolean;
  vacantBeds: number;
  upcomingReleaseDates: string[];
  property: RoomDetailProperty;
}

/** Map fields of `GET /property/:propertyId` (guest view). Coordinates may arrive as strings. */
export interface PropertyLocation {
  address: string | null;
  googleMapUrl: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
}
