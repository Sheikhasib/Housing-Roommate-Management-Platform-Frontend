import type { CloudinaryImage } from "@/types/room";
import type { ViewingStatus, ViewingTimeSlot } from "@/validation/enums";

/** The ViewingRequest row returned by `create` and `cancel`. */
export interface Viewing {
  id: string;
  preferredDate: string;
  timeSlot: ViewingTimeSlot;
  message: string | null;
  scheduledDateTime: string | null;
  status: ViewingStatus;
  rejectionReason: string | null;
  tenantProfileId: string;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewingRoomProperty {
  id: string;
  title: string;
  city: string;
  area: string | null;
}

export interface ViewingRoom {
  id: string;
  name: string;
  monthlyRent: string;
  images: CloudinaryImage[] | null;
  property: ViewingRoomProperty;
}

/** One item of `GET /viewing/my-requests`. */
export interface TenantViewing extends Viewing {
  room: ViewingRoom;
}
