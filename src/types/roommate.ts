import type { Gender, LeaseStatus, MembershipStatus, RoommateRequestStatus } from "@/validation/enums";

/** The trimmed card shape: never email, phone or date of birth (spec 13). */
export interface MatchCardPerson {
  id: string;
  name: string;
  imageUrl: string | null;
  occupation: string | null;
  bio: string | null;
  preferredCity: string | null;
  monthlyBudgetMax: number | null;
  moveInDate: string | null;
  smoker: boolean;
  petFriendly: boolean;
  hasPets: boolean;
  gender: Gender | null;
}

/** One ranked match from GET /roommate/match. `id` is the tenant profile id. */
export interface RoommateMatch extends MatchCardPerson {
  lookingForRoommate: boolean;
  /** 0 to 100, computed by the server. */
  score: number;
}

export interface RoommateRequestRow {
  id: string;
  message: string | null;
  status: RoommateRequestStatus;
  createdAt?: string;
  sender: MatchCardPerson;
  receiver: MatchCardPerson;
}

/** One item of GET /roommate/my-pairs. `roommate` is always the other tenant. */
export interface RoommatePairRow {
  id: string;
  createdAt: string;
  meTenantProfileId: string;
  roommate: {
    tenantProfileId: string;
    name: string;
    imageUrl: string | null;
    occupation: string | null;
  };
}

export type MembershipRole = "HOLDER" | "MEMBER";

/** One item of GET /roommate/memberships/my (backend spec 08). Holder and member never carry contact fields. */
export interface MembershipRow {
  id: string;
  status: MembershipStatus;
  message: string | null;
  respondedAt: string | null;
  joinedAt: string | null;
  removedAt: string | null;
  removedBy: string | null;
  removalReason: string | null;
  createdAt: string;
  role: MembershipRole;
  lease: { id: string; startDate: string; endDate: string; status: LeaseStatus };
  room: {
    id: string;
    name: string;
    monthlyRent: string | number;
    property: { id: string; title: string; city: string };
  };
  holder: MatchCardPerson;
  member: MatchCardPerson;
}
