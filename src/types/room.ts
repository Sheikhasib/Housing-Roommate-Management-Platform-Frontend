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
