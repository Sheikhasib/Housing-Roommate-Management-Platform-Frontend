"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useGetMe } from "@/hooks/useGetMe";
import { logoutAction } from "@/lib/auth/actions";
import type { Role } from "@/validation/enums";

export interface SessionUser {
  id: string;
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

/** The client session: the current user from GET /auth/me. Keep every consumer on this hook. */
export function useSession(): Session {
  const queryClient = useQueryClient();
  const { data, isPending } = useGetMe();

  async function logout(): Promise<void> {
    queryClient.clear();
    await logoutAction();
  }

  const user: SessionUser | null = data
    ? { id: data.id, name: data.name, email: data.email, role: data.role, avatarUrl: data.imageUrl || null }
    : null;

  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: user !== null,
    isLoading: isPending,
    logout,
  };
}
