import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE,
  REFRESH_COOKIE_OPTIONS,
  type AuthTokens,
} from "@/lib/auth/constants";

/** For Server Actions and Route Handlers only. proxy.ts sets cookies on its response instead. */
export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, ACCESS_COOKIE_OPTIONS);
  store.set(REFRESH_COOKIE, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}
