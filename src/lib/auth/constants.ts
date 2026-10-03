/** Session constants shared by proxy.ts, Server Actions and the browser client. No server-only imports here. */
export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

const ACCESS_MAX_AGE = 60 * 60 * 24;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export const ACCESS_COOKIE_OPTIONS = cookieOptions(ACCESS_MAX_AGE);
export const REFRESH_COOKIE_OPTIONS = cookieOptions(REFRESH_MAX_AGE);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Route prefixes that need a session. Role rules live in proxy.ts. */
export const PROTECTED_PREFIXES = ["/admin", "/owner", "/dashboard", "/notifications"] as const;

/** Guest-only pages. A logged-in user is sent to their home instead. */
export const AUTH_PAGES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;

export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
