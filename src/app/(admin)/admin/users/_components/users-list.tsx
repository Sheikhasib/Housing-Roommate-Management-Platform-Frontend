"use client";

import { Users } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AdminUser } from "@/types/admin";
import { ROLES, USER_STATUSES } from "@/validation/enums";
import { useAdminUsers } from "../../_hooks/use-admin-queries";
import { UserActions } from "./user-actions";

const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }));
const STATUS_OPTIONS = USER_STATUSES.filter((value) => value !== "DELETED").map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}));

/** The tenant or owner verification state, when the user has that profile. */
function verificationOf(user: AdminUser) {
  if (user.role === "TENANT") return user.tenantProfile?.verificationStatus ?? null;
  if (user.role === "OWNER") return user.ownerProfile?.verificationStatus ?? null;
  return null;
}

const COLUMNS: DataTableColumn<AdminUser>[] = [
  {
    key: "name",
    header: "User",
    cell: (user) => (
      <div className="max-w-56 min-w-0">
        <p className="truncate font-medium text-foreground" title={user.name}>
          {user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={user.email}>
          {user.email}
        </p>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    cell: (user) => <span className="text-sm text-foreground">{ROLE_LABELS[user.role]}</span>,
  },
  { key: "status", header: "Status", cell: (user) => <StatusBadge status={user.status} /> },
  {
    key: "verification",
    header: "Verification",
    cell: (user) => {
      const status = verificationOf(user);
      return status ? <StatusBadge status={status} /> : <span className="text-muted-foreground">Not applicable</span>;
    },
  },
  {
    key: "createdAt",
    header: "Joined",
    sortable: true,
    cell: (user) => <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>,
  },
];

export function UsersList() {
  const { page, limit, searchTerm, sortOrder, getParam } = useUrlState();
  const role = getParam("role");
  const status = getParam("status");
  const query = useAdminUsers({
    page,
    limit,
    searchTerm,
    role,
    status,
    // Only createdAt is a sortable field on this endpoint.
    sortBy: "createdAt",
    sortOrder,
  });

  const filtered = Boolean(searchTerm || role || status);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput label="Search users" placeholder="Search by name or email" className="sm:max-w-sm" />
        <FilterSelect param="role" label="Role" allLabel="All roles" options={ROLE_OPTIONS} />
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          caption="Platform users"
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(user) => user.id}
          isLoading={query.isPending}
          actions={(user) => <UserActions user={user} />}
          empty={{
            icon: Users,
            title: filtered ? "No users match these filters" : "No users yet",
            description: filtered ? "Try a different search, role or status." : "Users appear here once they register.",
          }}
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
