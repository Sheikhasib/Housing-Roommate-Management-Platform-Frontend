import type { Gender, VerificationStatus } from "@/validation/enums";

/** A stored verification document: a Cloudinary URL and its public id. */
export interface VerificationDocument {
  url: string;
  publicId: string;
}

/** Fields of the user row returned by PATCH /user/update-me and /user/profile-image. */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
}

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  occupation: string | null;
  bio: string | null;
  preferredCity: string | null;
  monthlyBudgetMax: number | null;
  moveInDate: string | null;
  smoker: boolean;
  petFriendly: boolean;
  hasPets: boolean;
  lookingForRoommate: boolean;
  verificationStatus: VerificationStatus;
  verificationDocUrl: string | null;
  rejectionReason: string | null;
}

export interface OwnerProfile {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  companyName: string | null;
  address: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  documents: VerificationDocument[] | null;
}

export interface ManagerProfile {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  bio: string | null;
}
