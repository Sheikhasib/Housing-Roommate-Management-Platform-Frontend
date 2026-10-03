import { jwtVerify } from "jose";

import { AUTH_PAGES, matchesPrefix } from "@/lib/auth/constants";
import { ROLES, type Role } from "@/validation/enums";

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

/** Verifies the access token and returns its payload, or null when it is missing, expired or invalid. */
export async function verifyAccessToken(token: string | undefined): Promise<SessionPayload | null> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const { userId, name, email, role } = payload;
    if (
      typeof userId !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      !(ROLES as readonly string[]).includes(role)
    ) {
      return null;
    }
    return { userId, name, email, role: role as Role };
  } catch {
    return null;
  }
}

/**
 * Accepts only same-site paths: must start with a single "/", contain no backslash and not point
 * at a guest-only auth page (with or without a query string or sub-path).
 */
export function getSafeRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\")) {
    return null;
  }
  const pathname = target.split(/[?#]/)[0];
  if (AUTH_PAGES.some((page) => matchesPrefix(pathname, page))) return null;
  return target;
}
