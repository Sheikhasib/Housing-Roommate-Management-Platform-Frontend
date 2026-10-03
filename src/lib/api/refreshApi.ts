import { ofetch } from "ofetch";

import { ACCESS_COOKIE, REFRESH_COOKIE, type AuthTokens } from "@/lib/auth/constants";
import { ApiError, toApiError } from "@/lib/api/apiError";
import type { ApiSuccess } from "@/types/api";

function readCookieValue(setCookies: string[], name: string): string | undefined {
  for (const line of setCookies) {
    const [pair] = line.split(";");
    const separator = pair.indexOf("=");
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return undefined;
}

/**
 * Calls POST /auth/refresh-token with the refresh cookie. Used by proxy.ts and refreshSession only.
 * It cannot use serverApi: proxy.ts has no cookies() store and the refresh token is passed in.
 *
 * Tokens come from the response body when present, otherwise from the backend Set-Cookie headers
 * (the backend spec documents the cookies but not the body).
 * Returns null when the backend rejects the refresh (session over); throws ApiError on network or 5xx.
 */
export async function requestTokenRefresh(refreshToken: string): Promise<AuthTokens | null> {
  const base = process.env.BACKEND_API_URL;
  if (!base) throw new ApiError(0, "BACKEND_API_URL is not set");

  const response = await ofetch.raw<Partial<ApiSuccess<Partial<AuthTokens> | null>>>(
    `${base.replace(/\/+$/, "")}/api/v1/auth/refresh-token`,
    {
      method: "POST",
      headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      retry: 0,
      ignoreResponseError: true,
    },
  );

  if (response.status >= 500) throw toApiError(response.status, response._data);
  if (response.status < 200 || response.status >= 300) return null;

  const body = response._data?.data;
  if (body && typeof body.accessToken === "string" && typeof body.refreshToken === "string") {
    return { accessToken: body.accessToken, refreshToken: body.refreshToken };
  }

  const setCookies = response.headers.getSetCookie();
  const accessToken = readCookieValue(setCookies, ACCESS_COOKIE);
  const newRefreshToken = readCookieValue(setCookies, REFRESH_COOKIE);
  if (accessToken && newRefreshToken) return { accessToken, refreshToken: newRefreshToken };
  return null;
}
