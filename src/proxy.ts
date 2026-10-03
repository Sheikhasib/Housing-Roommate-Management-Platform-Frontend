import { NextResponse, type NextRequest } from "next/server";

import { requestTokenRefresh } from "@/lib/api/refreshApi";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_OPTIONS,
  AUTH_PAGES,
  matchesPrefix,
  PROTECTED_PREFIXES,
  REFRESH_COOKIE,
  REFRESH_COOKIE_OPTIONS,
  type AuthTokens,
} from "@/lib/auth/constants";
import { verifyAccessToken, type SessionPayload } from "@/lib/auth/jwt";
import { AREA_HOME, getRoleHome, ROLE_AREA, type Area } from "@/lib/permissions";

type Zone = Area | "account";

const ZONE_BY_PREFIX: Record<(typeof PROTECTED_PREFIXES)[number], Zone> = {
  "/admin": "admin",
  "/owner": "owner",
  "/dashboard": "tenant",
  "/notifications": "account",
};

function findZone(pathname: string): Zone | null {
  const prefix = PROTECTED_PREFIXES.find((candidate) => matchesPrefix(pathname, candidate));
  return prefix ? ZONE_BY_PREFIX[prefix] : null;
}

type CookieChange = { type: "set"; tokens: AuthTokens } | { type: "clear" } | null;

function applyCookieChange(response: NextResponse, change: CookieChange): NextResponse {
  if (change?.type === "set") {
    response.cookies.set(ACCESS_COOKIE, change.tokens.accessToken, ACCESS_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE, change.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  } else if (change?.type === "clear") {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  return response;
}

function redirectTo(request: NextRequest, path: string, change: CookieChange): NextResponse {
  return applyCookieChange(NextResponse.redirect(new URL(path, request.url)), change);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const zone = findZone(pathname);
  const isAuthPage = AUTH_PAGES.some((page) => matchesPrefix(pathname, page));
  if (!zone && !isAuthPage) return NextResponse.next();

  let session: SessionPayload | null = await verifyAccessToken(
    request.cookies.get(ACCESS_COOKIE)?.value,
  );
  let change: CookieChange = null;

  if (!session) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      try {
        const tokens = await requestTokenRefresh(refreshToken);
        session = tokens ? await verifyAccessToken(tokens.accessToken) : null;
        change = tokens && session ? { type: "set", tokens } : { type: "clear" };
      } catch {
        // Backend unreachable: keep the cookies and treat this request as a guest.
      }
    } else if (request.cookies.has(ACCESS_COOKIE)) {
      change = { type: "clear" };
    }
  }

  if (!session) {
    if (zone) {
      const loginUrl = `/login?redirectTo=${encodeURIComponent(`${pathname}${search}`)}`;
      return redirectTo(request, loginUrl, change);
    }
    return applyCookieChange(NextResponse.next(), change);
  }

  if (isAuthPage) return redirectTo(request, getRoleHome(session.role), change);

  if (zone && zone !== "account" && ROLE_AREA[session.role] !== zone) {
    return redirectTo(request, AREA_HOME[ROLE_AREA[session.role]], change);
  }

  if (change?.type === "set") {
    // Make the new tokens visible to this same request (Server Components read them via cookies()).
    request.cookies.set(ACCESS_COOKIE, change.tokens.accessToken);
    request.cookies.set(REFRESH_COOKIE, change.tokens.refreshToken);
    const response = NextResponse.next({ request: { headers: new Headers(request.headers) } });
    return applyCookieChange(response, change);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
