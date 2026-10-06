"use client";

import { Building2 } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import type { OwnerVerificationRow } from "@/types/admin";
import { VERIFICATION_STATUSES } from "@/validation/enums";
import { useOwnerVerifications } from "../../_hooks/use-admin-queries";
import { ReviewActions } from "./review-actions";

const STATUS_OPTIONS = VERIFICATION_STATUSES.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}));

const COLUMNS: DataTableColumn<OwnerVerificationRow>[] = [
  {
    key: "applicant",
    header: "Owner",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{row.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.email}</p>
        {row.companyName ? <p className="truncate text-xs text-muted-foreground">{row.companyName}</p> : null}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <div className="space-y-1">
        <StatusBadge status={row.verificationStatus} />
        {row.verificationStatus === "REJECTED" && row.rejectionReason ? (
          <p className="max-w-56 text-xs text-muted-foreground">{row.rejectionReason}</p>
        ) : null}
      </div>
    ),
  },
  {
    key: "properties",
    header: "Properties",
    cell: (row) => <span className="text-sm text-foreground">{row._count.properties}</span>,
  },
  {
    key: "createdAt",
    header: "Profile created",
    cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
  },
];

export function OwnerVerifications() {
  const { page, limit, searchTerm, getParam } = useUrlState();
  const verificationStatus = getParam("verificationStatus") || "PENDING";
  const query = useOwnerVerifications({ page, limit, searchTerm, verificationStatus });

  const statusLabel = verificationStatus.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          label="Search owners"
          placeholder="Search by name, email or company"
        />
        <FilterSelect
          param="verificationStatus"
          label="Status"
          defaultValue="PENDING"
          options={STATUS_OPTIONS}
        />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          caption={`Owner verifications, ${statusLabel}`}
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(row) => row.id}
          isLoading={query.isPending}
          actions={(row) => (
            <ReviewActions
              kind="owner"
              profileId={row.id}
              applicantName={row.name}
              documents={row.documents ?? []}
              reviewable={row.verificationStatus === "PENDING"}
            />
          )}
          empty={{
            icon: Building2,
            title: verificationStatus === "PENDING" && !searchTerm ? "No pending verifications" : `No ${statusLabel} owners found`,
            description: searchTerm
              ? "Try a different name, email or company."
              : "Owners who ask for verification appear here.",
          }}
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
