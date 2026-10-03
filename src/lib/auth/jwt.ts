import { jwtVerify } from "jose";

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

/** Accepts only same-site paths: must start with a single "/" and contain no backslash. */
export function getSafeRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\")) {
    return null;
  }
  return target;
}
