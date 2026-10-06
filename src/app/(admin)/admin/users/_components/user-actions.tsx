"use client";

import { useId, useState } from "react";
import { MoreHorizontal, ShieldBan, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/hooks/useRole";
import { useSession } from "@/hooks/useSession";
import { updateUserRole, updateUserStatus } from "@/lib/api/adminClient";
import { hasPermission, ROLE_LABELS } from "@/lib/permissions";
import type { AdminUser } from "@/types/admin";
import {
  ASSIGNABLE_ROLES,
  optionalText,
  UpdateUserRoleZodSchema,
  UpdateUserStatusZodSchema,
  type AssignableRole,
} from "@/validation/admin";
import { errorMessage, useRefreshAdminData } from "../../_hooks/use-admin-queries";

type OpenDialog = "status" | "role" | null;

function ReasonField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Reason (optional)</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder="Add a note for the audit log"
      />
    </div>
  );
}

function DisabledReason({ children }: { children: string }) {
  return <span className="block text-xs font-normal text-muted-foreground">{children}</span>;
}

export function UserActions({ user }: { user: AdminUser }) {
  const { user: me } = useSession();
  const { role } = useRole();
  const refresh = useRefreshAdminData();
  const reasonId = useId();
  const roleSelectId = useId();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState<AssignableRole | "">("");

  const isSelf = me?.id === user.id;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const canBlock = !isSelf && !isSuperAdmin && user.status !== "DELETED";
  const blockReason = isSelf
    ? "You cannot change your own account"
    : isSuperAdmin
      ? "A super admin account cannot be changed"
      : null;
  const roleReason = isSelf
    ? "You cannot change your own role"
    : isSuperAdmin
      ? "A super admin role cannot be changed"
      : null;
  const canChangeRole = !isSelf && !isSuperAdmin;

  const targetStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
  const isBlocking = targetStatus === "BLOCKED";
  const roleOptions = ASSIGNABLE_ROLES.filter((option) => option !== user.role);

  const open = (next: OpenDialog) => {
    setReason("");
    setNewRole("");
    setDialog(next);
  };

  const confirmStatus = async () => {
    try {
      const body = UpdateUserStatusZodSchema.parse({
        status: targetStatus,
        reason: optionalText(reason),
      });
      const response = await updateUserStatus(user.id, body);
      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  const confirmRole = async () => {
    try {
      const body = UpdateUserRoleZodSchema.parse({ role: newRole, reason: optionalText(reason) });
      const response = await updateUserRole(user.id, body);
      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  // A deleted account has no actions the backend would accept.
  if (user.status === "DELETED") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!canBlock} onSelect={() => open("status")} className="min-h-10">
            {isBlocking ? <ShieldBan aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            <span>
              {isBlocking ? "Block user" : "Unblock user"}
              {blockReason ? <DisabledReason>{blockReason}</DisabledReason> : null}
            </span>
          </DropdownMenuItem>
          <Can permission="users.changeRole">
            <DropdownMenuItem
              disabled={!canChangeRole}
              onSelect={() => open("role")}
              className="min-h-10"
            >
              <UserCog aria-hidden="true" />
              <span>
                Change role
                {roleReason ? <DisabledReason>{roleReason}</DisabledReason> : null}
              </span>
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={dialog === "status"}
        onOpenChange={(next) => !next && setDialog(null)}
        destructive={isBlocking}
        title={isBlocking ? `Block ${user.name}?` : `Unblock ${user.name}?`}
        description={
          isBlocking
            ? `${user.name} (${user.email}) will be rejected on their next request and cannot use the platform until you unblock them. They are not notified.`
            : `${user.name} (${user.email}) will be able to sign in and use the platform again. They are not notified.`
        }
        confirmLabel={isBlocking ? "Block user" : "Unblock user"}
        onConfirm={confirmStatus}
      >
        <ReasonField id={reasonId} value={reason} onChange={setReason} />
      </ConfirmDialog>

      {hasPermission(role, "users.changeRole") ? (
        <ConfirmDialog
          open={dialog === "role"}
          onOpenChange={(next) => !next && setDialog(null)}
          title={`Change role for ${user.name}`}
          description={
            newRole
              ? `Change ${user.name} from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[newRole]}. A missing ${ROLE_LABELS[newRole].toLowerCase()} profile is created, and existing profiles are kept.`
              : `Choose the new role for ${user.name}. Their current role is ${ROLE_LABELS[user.role]}.`
          }
          confirmLabel="Change role"
          confirmDisabled={!newRole}
          onConfirm={confirmRole}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={roleSelectId}>New role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as AssignableRole)}>
                <SelectTrigger id={roleSelectId} className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ROLE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ReasonField id={`${reasonId}-role`} value={reason} onChange={setReason} />
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
