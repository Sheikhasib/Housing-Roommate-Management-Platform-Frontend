import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type { MembershipRow, RoommateMatch, RoommatePairRow, RoommateRequestRow } from "@/types/roommate";
import type {
  InviteMembershipPayload,
  RemoveMembershipPayload,
  RespondMembershipPayload,
  RespondRoommatePayload,
  SendRoommatePayload,
} from "@/validation/roommate";

export interface MyRequestsQuery {
  page: number;
  limit: number;
  status?: string;
}

export interface MyRequestsResult {
  rows: RoommateRequestRow[];
  meta: ApiMeta;
}

/** Ranked matches, best first. An array without pagination, cached by the server for 5 minutes. */
export async function getRoommateMatches(): Promise<RoommateMatch[]> {
  const response = await apiClient<ApiSuccess<RoommateMatch[]>>("/roommate/match");
  return response.data;
}

export function sendRoommateRequest(body: SendRoommatePayload) {
  return apiClient<ApiSuccess<{ id: string }>>("/roommate/request", { method: "POST", body });
}

/** Sent and received requests together; the page splits them by side. */
export async function getMyRoommateRequests(query: MyRequestsQuery): Promise<MyRequestsResult> {
  const { page, limit, status } = query;
  const response = await apiClient<ApiSuccess<RoommateRequestRow[]>>("/roommate/my-requests", {
    query: { page, limit, ...(status ? { status } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export function respondToRoommateRequest(requestId: string, body: RespondRoommatePayload) {
  return apiClient<ApiSuccess<{ id: string; status: string }>>(
    `/roommate/request/${encodeURIComponent(requestId)}/respond`,
    { method: "PATCH", body },
  );
}

export async function getMyPairs(): Promise<RoommatePairRow[]> {
  const response = await apiClient<ApiSuccess<RoommatePairRow[]>>("/roommate/my-pairs");
  return response.data;
}

export function removeRoommatePair(pairId: string) {
  return apiClient<ApiSuccess<{ message: string }>>(`/roommate/pair/${encodeURIComponent(pairId)}`, {
    method: "DELETE",
  });
}

export interface MyMembershipsQuery {
  page: number;
  limit: number;
  status?: string;
}

export interface MyMembershipsResult {
  rows: MembershipRow[];
  meta: ApiMeta;
}

export async function getMyMemberships(query: MyMembershipsQuery): Promise<MyMembershipsResult> {
  const { page, limit, status } = query;
  const response = await apiClient<ApiSuccess<MembershipRow[]>>("/roommate/memberships/my", {
    query: { page, limit, ...(status ? { status } : {}) },
  });
  return {
    rows: response.data,
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

export function inviteMember(body: InviteMembershipPayload) {
  return apiClient<ApiSuccess<{ id: string }>>("/roommate/memberships/invite", { method: "POST", body });
}

export function respondToMembership(membershipId: string, body: RespondMembershipPayload) {
  return apiClient<ApiSuccess<{ id: string }>>(
    `/roommate/memberships/${encodeURIComponent(membershipId)}/respond`,
    { method: "PATCH", body },
  );
}

export function leaveMembership(membershipId: string) {
  return apiClient<ApiSuccess<{ id: string }>>(
    `/roommate/memberships/${encodeURIComponent(membershipId)}/leave`,
    { method: "POST" },
  );
}

export function removeMembership(membershipId: string, body: RemoveMembershipPayload) {
  return apiClient<ApiSuccess<{ id: string }>>(
    `/roommate/memberships/${encodeURIComponent(membershipId)}/remove`,
    { method: "POST", body },
  );
}
