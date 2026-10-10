"use client";

import { UserCheck } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import type { TenantVerificationRow } from "@/types/admin";
import { useTenantVerifications } from "../../_hooks/use-admin-queries";
import { ReviewActions } from "./review-actions";

const COLUMNS: DataTableColumn<TenantVerificationRow>[] = [
  {
    key: "applicant",
    header: "Tenant",
    cell: (row) => (
      <div className="max-w-56 min-w-0">
        <p className="truncate font-medium text-foreground" title={row.name}>
          {row.name}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={row.email}>
          {row.email}
        </p>
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.verificationStatus} /> },
  {
    key: "createdAt",
    header: "Profile created",
    cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
  },
];

export function TenantVerifications() {
  const { page, limit, searchTerm } = useUrlState();
  const query = useTenantVerifications({ page, limit, searchTerm });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput label="Search tenants" placeholder="Search by name or email" />
        <p className="text-sm text-muted-foreground sm:pb-2.5">
          Lists tenants waiting for review, oldest first.
        </p>
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          caption="Tenant verifications waiting for review"
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(row) => row.id}
          isLoading={query.isPending}
          actions={(row) => (
            <ReviewActions
              kind="tenant"
              profileId={row.id}
              applicantName={row.name}
              documents={row.verificationDocUrl ? [{ url: row.verificationDocUrl, publicId: row.id }] : []}
              reviewable={row.verificationStatus === "PENDING"}
            />
          )}
          empty={{
            icon: UserCheck,
            title: searchTerm ? "No tenants match this search" : "No pending verifications",
            description: searchTerm
              ? "Try a different name or email."
              : "Tenants who upload an identity document appear here.",
          }}
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
