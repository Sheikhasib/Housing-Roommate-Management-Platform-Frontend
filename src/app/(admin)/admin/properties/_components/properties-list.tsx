"use client";

import { Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TextFilter } from "@/components/shared/text-filter";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { deleteProperty } from "@/lib/api/adminClient";
import { formatDate } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import type { AdminPropertyRow } from "@/types/admin";
import { PROPERTY_TYPES } from "@/validation/enums";
import { errorMessage, useAdminProperties, useRefreshAdminData } from "../../_hooks/use-admin-queries";

const TYPE_OPTIONS = PROPERTY_TYPES.map((value) => ({ value, label: PROPERTY_TYPE_LABELS[value] }));

const COLUMNS: DataTableColumn<AdminPropertyRow>[] = [
  {
    key: "title",
    header: "Property",
    cell: (property) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{property.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[property.area, property.city].filter(Boolean).join(", ")}
        </p>
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    cell: (property) => <span className="text-sm text-foreground">{PROPERTY_TYPE_LABELS[property.type]}</span>,
  },
  {
    key: "owner",
    header: "Owner",
    cell: (property) => (
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">{property.owner.name}</p>
        <p className="truncate text-xs text-muted-foreground">{property.owner.email}</p>
        <StatusBadge status={property.owner.verificationStatus} />
      </div>
    ),
  },
  {
    key: "rooms",
    header: "Rooms",
    cell: (property) => <span className="text-sm text-foreground">{property._count.rooms}</span>,
  },
  {
    key: "createdAt",
    header: "Listed",
    sortable: true,
    cell: (property) => <span className="text-sm text-muted-foreground">{formatDate(property.createdAt)}</span>,
  },
];

function PropertyActions({ property }: { property: AdminPropertyRow }) {
  const refresh = useRefreshAdminData();

  const confirmDelete = async () => {
    try {
      const response = await deleteProperty(property.id);
      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <ConfirmDialog
      destructive
      title={`Delete ${property.title}?`}
      description={`This removes the listing in ${property.city} owned by ${property.owner.name} from the platform. Its ${property._count.rooms} room(s) and units are not changed, but the property no longer appears in any list.`}
      confirmLabel="Delete property"
      onConfirm={confirmDelete}
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${property.title}`}>
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}

export function PropertiesList() {
  const { page, limit, searchTerm, sortOrder, getParam } = useUrlState();
  const city = getParam("city");
  const type = getParam("type");
  const query = useAdminProperties({
    page,
    limit,
    searchTerm,
    city,
    type,
    // Only createdAt is a sortable field on this endpoint.
    sortBy: "createdAt",
    sortOrder,
  });

  const filtered = Boolean(searchTerm || city || type);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput label="Search properties" placeholder="Search by title or city" className="sm:max-w-sm" />
        <TextFilter param="city" label="City" placeholder="Any city" />
        <FilterSelect param="type" label="Type" allLabel="All types" options={TYPE_OPTIONS} />
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <DataTable
          caption="All properties"
          columns={COLUMNS}
          rows={query.data?.rows ?? []}
          getRowId={(property) => property.id}
          isLoading={query.isPending}
          actions={(property) => <PropertyActions property={property} />}
          empty={{
            icon: Building2,
            title: filtered ? "No properties match these filters" : "No properties yet",
            description: filtered
              ? "Try a different search, city or type."
              : "Properties appear here once owners list them.",
          }}
          footer={query.data ? <Pagination meta={query.data.meta} /> : null}
        />
      )}
    </div>
  );
}
