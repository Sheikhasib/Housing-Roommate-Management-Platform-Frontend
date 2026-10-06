import type { CloudinaryImage } from "@/types/room";
import type { RoomStatus, RoomType } from "@/validation/enums";

/*
 * Shapes in this file come from the backend specs (06-room.md, 17-manager.md), not from a live
 * response. Fields marked "from spec, verify against the live backend" must be checked in the
 * running app before they are relied on.
 */

/** One row of the owner/manager rooms list, normalised from both endpoints. */
export interface RoomRow {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  isPublished: boolean;
  bedCount: number;
  occupiedBeds: number;
  /** Decimal string. */
  monthlyRent: string;
  property: { id: string; title: string; city: string | null };
}

/**
 * One row of `GET /room/my-rooms`. From spec, verify against the live backend: the spec lists the
 * `property` and `_count` includes and the availability decoration; the scalar room fields are
 * the Room model.
 */
export interface OwnerRoomApiRow {
  id: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  isPublished: boolean;
  bedCount: number;
  occupiedBeds: number;
  monthlyRent: string;
  property: { id: string; title: string; city: string; images: CloudinaryImage[] | null };
  _count: { applications: number; leases: number };
  availableBeds: number;
  vacantBeds: number;
  availableNow: boolean;
  nextAvailableDate: string | null;
  upcomingReleaseDates: string[];
}

/**
 * One live room nested in a property of `GET /manager/my-properties`. From spec, verify against
 * the live backend: spec 17 lists name, type, monthlyRent, status, isPublished, occupiedBeds and
 * bedCount; `id` is assumed because the list links to the room.
 */
export interface ManagerRoomApiRow {
  id: string;
  name: string;
  type: RoomType;
  monthlyRent: string;
  status: RoomStatus;
  isPublished: boolean;
  occupiedBeds: number;
  bedCount: number;
}

/** One property of `GET /manager/my-properties` with its rooms. From spec, verify against the live backend. */
export interface ManagerPropertyApiRow {
  id: string;
  title: string;
  city: string;
  rooms: ManagerRoomApiRow[];
}

/**
 * `GET /room/:roomId` as the owning OWNER or an assigned manager (drafts included). From spec,
 * verify against the live backend: the public detail fields plus `isPublished`; `images` and
 * `amenities` are JSON arrays that may be null.
 */
export interface OwnerRoomDetail {
  id: string;
  name: string;
  description: string | null;
  type: RoomType;
  status: RoomStatus;
  isPublished: boolean;
  bedCount: number;
  occupiedBeds: number;
  /** Decimal strings. */
  monthlyRent: string;
  bookingDeposit: string;
  minLeaseMonths: number;
  sizeSqft: number | null;
  isFurnished: boolean;
  amenities: string[] | null;
  images: CloudinaryImage[] | null;
  availableFrom: string | null;
  vacantBeds: number;
  property: { id: string; title: string; city: string };
}
