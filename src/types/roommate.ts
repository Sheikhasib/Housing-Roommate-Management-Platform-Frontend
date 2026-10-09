import type { Gender, RoommateRequestStatus } from "@/validation/enums";

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
