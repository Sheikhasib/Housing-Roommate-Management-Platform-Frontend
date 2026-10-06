import type {
  Application,
  ApplicationLease,
  ApplicationPayment,
  ApplicationRoom,
} from "@/types/application";

/*
 * Shapes come from backend specs 09 and 17, not from a live response. `payment` is optional on
 * purpose: manager responses have no `payment` key (spec 17 money isolation).
 */

/** Tenant fields in `owner-applications` rows (spec 09). */
export interface ApplicantSummary {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  occupation: string | null;
  user: { imageUrl: string | null } | null;
}

/** One item of `GET /application/owner-applications`. */
export interface OwnerApplicationRow extends Application {
  tenantProfile: ApplicantSummary;
  room: { id: string; name: string; monthlyRent: string };
  lease: ApplicationLease | null;
  payment?: ApplicationPayment | null;
}

/** Body of `GET /application/:id` as the owner or an assigned manager reads it. */
export interface OwnerApplicationDetail extends Application {
  tenantProfile: ApplicantSummary;
  room: ApplicationRoom;
  lease: ApplicationLease | null;
  payment?: ApplicationPayment | null;
  /** The spec lists tenant A/B names but not their field names, so only its presence is used. */
  roommatePair?: object | null;
}
