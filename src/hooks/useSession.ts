"use client";

import type { Role } from "@/validation/enums";

/**
 * TEMPORARY STUB. Replaced in 02-auth by the real session (useGetMe + cookies).
 * Keep every consumer on this hook so only this file changes.
 * It always returns a guest.
 */
export interface SessionUser {
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface Session {
  user: SessionUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

async function logout(): Promise<void> {
  // 02-auth replaces this with the logout Server Action.
}

export function useSession(): Session {
  return { user: null, role: null, isAuthenticated: false, isLoading: false, logout };
}
