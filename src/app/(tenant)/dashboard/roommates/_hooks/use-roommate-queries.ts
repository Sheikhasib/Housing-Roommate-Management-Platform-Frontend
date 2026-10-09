"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { leasesKey } from "@/app/(tenant)/dashboard/leases/_hooks/use-lease-queries";
import {
  getMembershipUtilityBills,
  getMyMemberships,
  getMyPairs,
  getMyRoommateRequests,
  getRoommateMatches,
  inviteMember,
  leaveMembership,
  removeMembership,
  removeRoommatePair,
  respondToMembership,
  respondToRoommateRequest,
  sendRoommateRequest,
  type MyMembershipsQuery,
  type MyRequestsQuery,
} from "@/lib/api/roommate";
import type {
  InviteMembershipPayload,
  RemoveMembershipPayload,
  RespondMembershipPayload,
  RespondRoommatePayload,
  SendRoommatePayload,
} from "@/validation/roommate";

export const matchesKey = ["roommate", "matches"] as const;
export const requestsKey = (params?: unknown) =>
  params === undefined ? (["roommate", "requests"] as const) : (["roommate", "requests", params] as const);

export const pairsKey = ["roommate", "pairs"] as const;
export const membershipsKey = (params?: unknown) =>
  params === undefined ? (["roommate", "memberships"] as const) : (["roommate", "memberships", params] as const);

const OPTIONS = { retry: false, refetchOnWindowFocus: false } as const;

function useErrorToast(error: unknown) {
  useEffect(() => {
    if (error) toast.error(errorMessage(error));
  }, [error]);
}

/** `enabled` stays false while matching is off, so the server is not asked. */
export function useRoommateMatches(enabled: boolean) {
  const result = useQuery({
    queryKey: matchesKey,
    queryFn: getRoommateMatches,
    enabled,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

export function useMyRoommateRequests(query: MyRequestsQuery) {
  const result = useQuery({
    queryKey: requestsKey(query),
    queryFn: () => getMyRoommateRequests(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/** Not optimistic: the server may refuse (400, 404 or 409) and its message is shown as it is. */
export function useSendRoommateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendRoommatePayload) => sendRoommateRequest(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestsKey() });
      void queryClient.invalidateQueries({ queryKey: matchesKey });
    },
  });
}

export function useRespondRoommateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: string; body: RespondRoommatePayload }) =>
      respondToRoommateRequest(requestId, body),
    // A refused answer (403 or 409) usually means the request changed meanwhile, so lists reload either way.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: requestsKey() });
      void queryClient.invalidateQueries({ queryKey: ["roommate", "pairs"] });
    },
  });
}

export function useMyPairs() {
  const result = useQuery({ queryKey: pairsKey, queryFn: getMyPairs, ...OPTIONS });
  useErrorToast(result.error);
  return result;
}

/** The backend declines the remaining requests of the two, so matches and requests reload too. */
export function useRemovePair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pairId: string) => removeRoommatePair(pairId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchesKey });
      void queryClient.invalidateQueries({ queryKey: requestsKey() });
      void queryClient.invalidateQueries({ queryKey: pairsKey });
    },
  });
}

export function useMyMemberships(query: MyMembershipsQuery) {
  const result = useQuery({
    queryKey: membershipsKey(query),
    queryFn: () => getMyMemberships(query),
    placeholderData: keepPreviousData,
    ...OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

export const utilityBillsKey = (membershipId: string) =>
  ["roommate", "utility-bills", membershipId] as const;

/** A 403 (not the holder or an ACTIVE member) reaches the page as the backend wrote it. */
export function useMembershipUtilityBills(membershipId: string) {
  return useQuery({
    queryKey: utilityBillsKey(membershipId),
    queryFn: () => getMembershipUtilityBills(membershipId),
    ...OPTIONS,
  });
}

function useMembershipMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // A refused change (403 or 409) usually means the row changed meanwhile, so the list reloads either way.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: membershipsKey() });
      void queryClient.invalidateQueries({ queryKey: leasesKey() });
    },
  });
}

export function useInviteMember() {
  return useMembershipMutation((body: InviteMembershipPayload) => inviteMember(body));
}

export function useRespondMembership() {
  return useMembershipMutation(({ id, body }: { id: string; body: RespondMembershipPayload }) =>
    respondToMembership(id, body),
  );
}

export function useLeaveMembership() {
  return useMembershipMutation((id: string) => leaveMembership(id));
}

export function useRemoveMembership() {
  return useMembershipMutation(({ id, body }: { id: string; body: RemoveMembershipPayload }) =>
    removeMembership(id, body),
  );
}
