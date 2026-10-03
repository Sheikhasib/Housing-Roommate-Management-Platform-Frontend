import {
  ofetch,
  type FetchOptions,
  type FetchRequest,
  type MappedResponseType,
  type ResponseType,
} from "ofetch";

import { ApiError, toApiError } from "@/lib/api/apiError";
import { refreshSession } from "@/lib/auth/actions";
import { matchesPrefix, PROTECTED_PREFIXES } from "@/lib/auth/constants";

const baseClient = ofetch.create({
  baseURL: "/api/v1",
  credentials: "include",
  retry: 0,
  onResponseError({ response }) {
    throw toApiError(response.status, response._data);
  },
  onRequestError() {
    throw new ApiError(0, "Network error. Check your connection and try again");
  },
});

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time: parallel 401s share the same Server Action call. */
function refreshOnce(): Promise<boolean> {
  refreshing ??= refreshSession()
    .then((result) => result.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function isAuthRequest(request: FetchRequest): boolean {
  return typeof request === "string" && request.startsWith("/auth/");
}

function leaveProtectedPage(): void {
  const { pathname, search } = window.location;
  if (PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    // A full page load on purpose: this runs outside React (no router) and it also drops the query cache.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?redirectTo=${encodeURIComponent(`${pathname}${search}`)}`;
  }
}

async function request<T = unknown, R extends ResponseType = "json">(
  url: FetchRequest,
  options?: FetchOptions<R>,
): Promise<MappedResponseType<R, T>> {
  try {
    return await baseClient<T, R>(url, options);
  } catch (error) {
    // /auth/me is the exception to the "/auth/ never retries" rule: it is how the session is read.
    const retryable = !isAuthRequest(url) || url === "/auth/me";
    if (!(error instanceof ApiError) || error.status !== 401 || !retryable) throw error;
    if (!(await refreshOnce())) {
      leaveProtectedPage();
      throw error;
    }
    return baseClient<T, R>(url, options);
  }
}

/** Browser client: same call signature as ofetch, plus one silent refresh-and-retry on 401. */
export const apiClient = Object.assign(request, {
  raw: baseClient.raw,
  native: baseClient.native,
  create: baseClient.create,
});
