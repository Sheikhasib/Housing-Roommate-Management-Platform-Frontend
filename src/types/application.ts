import type { CloudinaryImage } from "@/types/room";
import type { ApplicationStatus, LeaseStatus, PaymentStatus, RoomType } from "@/validation/enums";

/** The Application row returned by `apply` and `cancel`. */
export interface Application {
  id: string;
  status: ApplicationStatus;
  moveInDate: string;
  leaseMonths: number;
  message: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

/** Only the payment fields the tenant screens read (backend spec 12). `payment` is null before a deposit starts. */
export interface ApplicationPayment {
  status: PaymentStatus;
  paidAt?: string | null;
}

export interface ApplicationLease {
  id: string;
  status: LeaseStatus;
}

export interface ApplicationRoomProperty {
  id: string;
  title: string;
  city: string;
  area: string | null;
  images: CloudinaryImage[] | null;
}

/** Full room as returned inside tenant application rows. Money fields are strings. */
export interface ApplicationRoom {
  id: string;
  name: string;
  type: RoomType;
  monthlyRent: string;
  bookingDeposit: string;
  images: CloudinaryImage[] | null;
  property: ApplicationRoomProperty;
}

/** One item of `GET /application/my-applications` and the body of `GET /application/:id`. */
export interface TenantApplication extends Application {
  room: ApplicationRoom;
  lease: ApplicationLease | null;
  payment?: ApplicationPayment | null;
}
