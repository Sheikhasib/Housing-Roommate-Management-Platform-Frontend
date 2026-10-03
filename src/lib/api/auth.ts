import { apiClient } from "@/lib/api/apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Role, UserStatus } from "@/validation/enums";

/** Response of GET /auth/me: the user row (no password) with the role profiles. */
export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  imageUrl: string | null;
  tenantProfile: object | null;
  ownerProfile: object | null;
  managerProfile: object | null;
}

export async function getMe(): Promise<Me> {
  const response = await apiClient<ApiSuccess<Me>>("/auth/me");
  return response.data;
}
