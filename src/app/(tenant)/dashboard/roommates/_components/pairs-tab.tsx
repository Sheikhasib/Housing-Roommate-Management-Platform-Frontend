"use client";

import { Handshake, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { RoommatePairRow } from "@/types/roommate";
import { useMyPairs, useRemovePair } from "../_hooks/use-roommate-queries";
import { PersonAvatar } from "./match-card";
import { ListSkeleton } from "./roommates-skeleton";

const COLUMNS: DataTableColumn<RoommatePairRow>[] = [
  {
    key: "roommate",
    header: "Roommate",
    cell: (row) => (
      <div className="flex max-w-56 min-w-0 items-center gap-3 text-left">
        <PersonAvatar person={row.roommate} className="size-9" />
        <p className="truncate font-medium text-foreground" title={row.roommate.name}>
          {row.roommate.name}
        </p>
      </div>
    ),
  },
  {
    key: "occupation",
    header: "Occupation",
    wrap: true,
    cell: (row) => row.roommate.occupation || <span className="text-muted-foreground">Not set</span>,
  },
  { key: "createdAt", header: "Paired since", cell: (row) => formatDate(row.createdAt) },
];

function RemovePairButton({ pair }: { pair: RoommatePairRow }) {
  const removePair = useRemovePair();
  const name = pair.roommate.name;

  const confirm = async () => {
    try {
      const response = await removePair.mutateAsync(pair.id);
      toast.success(response.message);
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <ConfirmDialog
      title={`Remove ${name} as your roommate?`}
      description={`The pair ends and any open requests between you are declined. You can both send a new request later.`}
      confirmLabel="Remove"
      cancelLabel="Keep pair"
      destructive
      onConfirm={confirm}
      trigger={
        <Button type="button" size="sm" variant="outline" className="text-error-text" aria-label={`Remove pair with ${name}`}>
          <UserMinus aria-hidden="true" />
          Remove
        </Button>
      }
    />
  );
}

export function PairsTab() {
  const pairs = useMyPairs();

  if (pairs.isPending) return <ListSkeleton />;
  if (pairs.isError || !pairs.data) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <ErrorState error={pairs.error} onRetry={() => void pairs.refetch()} />
      </div>
    );
  }

  return (
    <DataTable
      columns={COLUMNS}
      rows={pairs.data}
      getRowId={(row) => row.id}
      actions={(row) => <RemovePairButton pair={row} />}
      empty={{
        icon: Handshake,
        title: "No pairs",
        description: "When a roommate request is accepted, your pair shows up here.",
      }}
      caption="Your roommate pairs"
    />
  );
}
