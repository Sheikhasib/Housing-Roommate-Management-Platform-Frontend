"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { getRoleHome, hasPermission, hasRole, type Permission } from "@/lib/permissions";
import type { Role } from "@/validation/enums";

interface CanProps {
  /** Allowed roles. Use this or `permission`. */
  roles?: readonly Role[];
  /** A named capability from src/lib/permissions.ts. */
  permission?: Permission;
  /** Shown when the role is not allowed. Defaults to nothing: hide, never disable. */
  fallback?: ReactNode;
  children: ReactNode;
}

function useAllowed(roles?: readonly Role[], permission?: Permission) {
  const { role, isLoading } = useSession();
  const allowed =
    (roles ? hasRole(role, roles) : true) && (permission ? hasPermission(role, permission) : true);
  return { allowed, isLoading, role };
}

/** Hides controls the current role may not use. The backend is still the authority. */
export function Can({ roles, permission, fallback = null, children }: CanProps) {
  const { allowed, isLoading } = useAllowed(roles, permission);
  if (isLoading || !allowed) return <>{fallback}</>;
  return <>{children}</>;
}

interface RoleGuardProps {
  roles: readonly Role[];
  children: ReactNode;
}

/** Guards a whole page section: shows an access-denied state for other roles. */
export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { allowed, isLoading, role } = useAllowed(roles);
  if (isLoading) return null;
  if (allowed) return <>{children}</>;

  return (
    <EmptyState
      icon={ShieldAlert}
      title="You do not have access to this page"
      description="Your account role cannot use this part of the site."
      action={
        <Button asChild>
          <Link href={role ? getRoleHome(role) : "/login"}>
            {role ? "Go to your dashboard" : "Log in"}
          </Link>
        </Button>
      }
    />
  );
}
