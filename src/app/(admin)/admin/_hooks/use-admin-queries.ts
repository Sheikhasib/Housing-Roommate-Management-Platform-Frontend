"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/apiError";
import {
  getAdminUsers,
  getOwnerVerifications,
  getTenantVerifications,
  type UsersQuery,
  type VerificationQuery,
} from "@/lib/api/adminClient";

export const ADMIN_USERS_KEY = ["admin", "users"] as const;
export const TENANT_VERIFICATIONS_KEY = ["admin", "tenant-verifications"] as const;
export const OWNER_VERIFICATIONS_KEY = ["admin", "owner-verifications"] as const;

const LIST_OPTIONS = { retry: false, refetchOnWindowFocus: false, placeholderData: keepPreviousData } as const;

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.errors[0]?.message || error.message;
  return "Something went wrong. Try again";
}

/** Raises one toast per failed load, as the Definition of Done asks. */
function useErrorToast(error: unknown) {
  useEffect(() => {
    if (error) toast.error(errorMessage(error));
  }, [error]);
}

export function useAdminUsers(query: UsersQuery) {
  const result = useQuery({
    queryKey: [...ADMIN_USERS_KEY, query],
    queryFn: () => getAdminUsers(query),
    ...LIST_OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

export function useTenantVerifications(query: VerificationQuery) {
  const result = useQuery({
    queryKey: [...TENANT_VERIFICATIONS_KEY, query],
    queryFn: () => getTenantVerifications(query),
    ...LIST_OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

export function useOwnerVerifications(query: VerificationQuery & { verificationStatus: string }) {
  const result = useQuery({
    queryKey: [...OWNER_VERIFICATIONS_KEY, query],
    queryFn: () => getOwnerVerifications(query),
    ...LIST_OPTIONS,
  });
  useErrorToast(result.error);
  return result;
}

/** After a decision: refetch the lists and re-render the server overview counts. */
export function useRefreshAdminData() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    router.refresh();
  };
}
