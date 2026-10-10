"use client";

import Link from "next/link";
import { DoorOpen, Inbox, Users, UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { useMyLeases } from "@/app/(tenant)/dashboard/leases/_hooks/use-lease-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useUrlState } from "@/hooks/useUrlState";
import { formatDate } from "@/lib/format";
import { membershipDetails } from "@/lib/membership";
import type { MembershipRow } from "@/types/roommate";
import { MEMBERSHIP_STATUSES } from "@/validation/enums";
import { useLeaveMembership, useMyMemberships } from "../_hooks/use-roommate-queries";
import { AnswerButtons } from "./answer-buttons";
import { InviteMembershipDialog } from "./invite-membership-dialog";
import { PersonAvatar } from "./match-card";
import { RemoveMembershipDialog } from "./remove-membership-dialog";
import { ListSkeleton } from "./roommates-skeleton";

/** The backend has no cap on limit, so everything is fetched once and filtered, pinned and paged here. */
const ALL_MEMBERSHIPS_QUERY = { page: 1, limit: 100 } as const;
const ACTIVE_LEASES_QUERY = { page: 1, limit: 100, status: "ACTIVE" } as const;

const STATUS_OPTIONS = MEMBERSHIP_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

function isAwaitingMyAnswer(row: MembershipRow): boolean {
  return row.role === "MEMBER" && row.status === "PENDING";
}

/** The other person: the member for the holder, the holder for the member. */
function otherPerson(row: MembershipRow) {
  return row.role === "HOLDER" ? row.member : row.holder;
}

function PersonCell({ row }: { row: MembershipRow }) {
  const person = otherPerson(row);
  return (
    <Link
      href={`/dashboard/roommates/memberships/${encodeURIComponent(row.id)}`}
      aria-label={`Open the membership with ${person.name} for ${row.room.name}`}
      className="flex min-h-10 max-w-56 min-w-0 items-center gap-3 rounded-lg text-left transition-colors duration-150 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <PersonAvatar person={person} className="size-9" />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground" title={person.name}>
          {person.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {row.role === "HOLDER" ? "Invited roommate" : "Lease holder"}
        </p>
      </div>
    </Link>
  );
}

function DetailsCell({ row }: { row: MembershipRow }) {
  const { user } = useSession();
  const text = membershipDetails(row, user?.id ?? null);
  return (
    <span className="line-clamp-2 min-w-0 break-words" title={text}>
      {text}
    </span>
  );
}

const COLUMNS: DataTableColumn<MembershipRow>[] = [
  { key: "person", header: "Roommate", cell: (row) => <PersonCell row={row} /> },
  {
    key: "room",
    header: "Room",
    wrap: true,
    cell: (row) => (
      <div className="min-w-0 text-left">
        <p className="font-medium text-foreground">{row.room.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.room.property.title}, {row.room.property.city}
        </p>
      </div>
    ),
  },
  {
    key: "role",
    header: "Your role",
    cell: (row) => <Badge variant={row.role === "HOLDER" ? "info" : "neutral"}>{row.role === "HOLDER" ? "Holder" : "Member"}</Badge>,
  },
  { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    key: "details",
    header: "Details",
    wrap: true,
    cell: (row) => <DetailsCell row={row} />,
  },
  { key: "createdAt", header: "Invited", cell: (row) => formatDate(row.createdAt) },
];

function LeaveButton({ row }: { row: MembershipRow }) {
  const leave = useLeaveMembership();

  const confirm = async () => {
    try {
      const response = await leave.mutateAsync(row.id);
      toast.success(response.message);
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <ConfirmDialog
      title="Leave this membership?"
      description={`The roommate membership for ${row.room.name} ends for both of you. You can be invited again later.`}
      confirmLabel="Leave"
      cancelLabel="Stay"
      destructive
      onConfirm={confirm}
      trigger={
        <Button type="button" size="sm" variant="outline" aria-label={`Leave membership for ${row.room.name}`}>
          <DoorOpen aria-hidden="true" />
          Leave
        </Button>
      }
    />
  );
}

function RowActions({ row }: { row: MembershipRow }) {
  const isHolder = row.role === "HOLDER";
  const person = otherPerson(row).name;

  if (row.status === "ACTIVE") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <LeaveButton row={row} />
        {isHolder ? (
          <RemoveMembershipDialog
            membershipId={row.id}
            title={`Remove ${person} from ${row.room.name}?`}
            description={`${person} loses access to the room's maintenance and utility bills. They can be invited again later.`}
            confirmLabel="Remove member"
            trigger={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-error-text"
                aria-label={`Remove ${person} from ${row.room.name}`}
              >
                <UserMinus aria-hidden="true" />
                Remove member
              </Button>
            }
          />
        ) : null}
      </div>
    );
  }

  if (isHolder && row.status === "PENDING") {
    return (
      <RemoveMembershipDialog
        membershipId={row.id}
        title={`Cancel the invitation to ${person}?`}
        description={`${person} can no longer accept this invitation. You can invite them again later.`}
        confirmLabel="Cancel invitation"
        trigger={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-error-text"
            aria-label={`Cancel invitation to ${person}`}
          >
            <X aria-hidden="true" />
            Cancel invitation
          </Button>
        }
      />
    );
  }

  return null;
}

function emptyFor(filtered: boolean): DataTableEmpty {
  return filtered
    ? {
        icon: Users,
        title: "No memberships with this status",
        description: "Try a different status or show all memberships.",
      }
    : {
        icon: Users,
        title: "No memberships",
        description: "Invitations and shared rooms show up here.",
      };
}

interface SectionProps {
  title: string;
  hint: string;
  count: number;
  children: React.ReactNode;
}

function Section({ title, hint, count, children }: SectionProps) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
        </h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  );
}

export function MembershipsTab() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const memberships = useMyMemberships(ALL_MEMBERSHIPS_QUERY);
  const activeLeases = useMyLeases(ACTIVE_LEASES_QUERY);

  if (memberships.isPending) return <ListSkeleton withFilter />;
  if (memberships.isError && !memberships.data) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <ErrorState error={memberships.error} onRetry={() => void memberships.refetch()} />
      </div>
    );
  }

  const filtered = (memberships.data?.rows ?? []).filter((row) => !status || row.status === status);
  // Invitations waiting for my answer are pinned on top, whatever the page.
  const awaiting = filtered.filter(isAwaitingMyAnswer);
  const others = filtered.filter((row) => !isAwaitingMyAnswer(row));

  const totalPages = Math.max(1, Math.ceil(others.length / limit));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * limit;
  const meta = { page: currentPage, limit, total: others.length, totalPages };

  const leasesForInvite = activeLeases.data?.rows ?? [];
  const nothingAtAll = awaiting.length === 0 && others.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
        {leasesForInvite.length > 0 ? <InviteMembershipDialog leases={leasesForInvite} /> : null}
      </div>

      {awaiting.length > 0 ? (
        <Section
          title="Awaiting your answer"
          hint="Accept to join the room, or decline. The lease holder is told either way."
          count={awaiting.length}
        >
          <DataTable
            columns={COLUMNS}
            rows={awaiting}
            getRowId={(row) => row.id}
            actions={(row) => <AnswerButtons row={row} />}
            empty={{ icon: Inbox, title: "No invitations" }}
            caption="Invitations awaiting your answer"
          />
        </Section>
      ) : null}

      {nothingAtAll || others.length > 0 ? (
        <Section
          title="Memberships"
          hint="Rooms you share as the lease holder or as a roommate member."
          count={others.length}
        >
          <DataTable
            columns={COLUMNS}
            rows={others.slice(pageStart, pageStart + limit)}
            getRowId={(row) => row.id}
            actions={(row) => <RowActions row={row} />}
            empty={emptyFor(Boolean(status))}
            caption="Your roommate memberships"
            footer={others.length > 0 ? <Pagination meta={meta} /> : undefined}
          />
        </Section>
      ) : null}
    </div>
  );
}
