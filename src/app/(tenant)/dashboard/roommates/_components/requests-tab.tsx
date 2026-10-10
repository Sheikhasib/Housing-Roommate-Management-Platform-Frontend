"use client";

import { Check, Inbox, Send, X } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn, type DataTableEmpty } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { useTenantProfile } from "@/hooks/useProfile";
import { formatDate } from "@/lib/format";
import type { MatchCardPerson, RoommateRequestRow } from "@/types/roommate";
import { ROOMMATE_REQUEST_STATUSES } from "@/validation/enums";
import { useMyRoommateRequests, useRespondRoommateRequest } from "../_hooks/use-roommate-queries";
import { LifestyleChips, PersonAvatar } from "./match-card";
import { RequestsSkeleton } from "./roommates-skeleton";

const ALL_REQUESTS_QUERY = { page: 1, limit: 100 } as const;

const STATUS_OPTIONS =ROOMMATE_REQUEST_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

function PersonCell({ person }: { person: MatchCardPerson }) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-left">
      <PersonAvatar person={person} className="size-9" />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[person.occupation, person.preferredCity].filter(Boolean).join(", ") || "No details yet"}
        </p>
      </div>
    </div>
  );
}

function RespondButtons({ request }: { request: RoommateRequestRow }) {
  const respond = useRespondRoommateRequest();

  const answer = (status: "ACCEPTED" | "DECLINED") => async () => {
    try {
      const response = await respond.mutateAsync({ requestId: request.id, body: { status } });
      toast.success(response.message);
    } catch (error) {
      // Guard messages (not the receiver, no longer pending) are shown as the server wrote them.
      toast.error(errorMessage(error));
      throw error;
    }
  };

  const name = request.sender.name;
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <ConfirmDialog
        title="Accept this roommate request?"
        description={`You and ${name} become roommates and a pair is created for both of you.`}
        confirmLabel="Accept"
        cancelLabel="Not now"
        onConfirm={answer("ACCEPTED")}
        trigger={
          <Button type="button" size="sm" aria-label={`Accept request from ${name}`}>
            <Check aria-hidden="true" />
            Accept
          </Button>
        }
      />
      <ConfirmDialog
        title="Decline this roommate request?"
        description={`${name} is told that you declined. You can both send a new request later.`}
        confirmLabel="Decline"
        cancelLabel="Keep request"
        destructive
        onConfirm={answer("DECLINED")}
        trigger={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-error-text"
            aria-label={`Decline request from ${name}`}
          >
            <X aria-hidden="true" />
            Decline
          </Button>
        }
      />
    </div>
  );
}

function columnsFor(side: "received" | "sent"): DataTableColumn<RoommateRequestRow>[] {
  return [
    {
      key: "person",
      header: side === "received" ? "From" : "To",
      cell: (row) => <PersonCell person={side === "received" ? row.sender : row.receiver} />,
    },
    {
      key: "lifestyle",
      header: "Lifestyle",
      wrap: true,
      cell: (row) => <LifestyleChips person={side === "received" ? row.sender : row.receiver} />,
    },
    {
      key: "message",
      header: "Message",
      wrap: true,
      cell: (row) => <span className="line-clamp-2 break-words">{row.message || "No message"}</span>,
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (row) => (row.createdAt ? formatDate(row.createdAt) : "-"),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];
}

const RECEIVED_COLUMNS = columnsFor("received");
const SENT_COLUMNS = columnsFor("sent");

function emptyFor(side: "received" | "sent", filtered: boolean): DataTableEmpty {
  if (filtered) {
    return {
      icon: side === "received" ? Inbox : Send,
      title: "No requests with this status",
      description: "Try a different status or show all requests.",
    };
  }
  return side === "received"
    ? {
        icon: Inbox,
        title: "No requests",
        description: "When another tenant asks to be your roommate, the request shows up here.",
      }
    : {
        icon: Send,
        title: "No requests",
        description: "Requests you send from the Matches tab show up here with their answer.",
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

export function RequestsTab() {
  const { page, limit, getParam } = useUrlState();
  const status = getParam("status");
  const profile = useTenantProfile(true);
  // The backend has no cap on limit, so everything is fetched once and split, filtered and paged here.
  const requests = useMyRoommateRequests(ALL_REQUESTS_QUERY);

  if (profile.isPending || requests.isPending) return <RequestsSkeleton />;

  const error = profile.error ?? requests.error;
  if (profile.isError || !profile.data || (requests.isError && !requests.data)) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <ErrorState
          error={error}
          onRetry={() => {
            void profile.refetch();
            void requests.refetch();
          }}
        />
      </div>
    );
  }

  // Which side I am: the receiver id of a row is a tenant profile id, the same id GET /tenant/me returns.
  const myProfileId = profile.data.id;
  const rows = (requests.data?.rows ?? []).filter((row) => !status || row.status === status);
  const received = rows.filter((row) => row.receiver.id === myProfileId);
  const sent = rows.filter((row) => row.sender.id === myProfileId);

  // One shared page control: the page count follows the longer of the two lists.
  const total = Math.max(received.length, sent.length);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * limit;
  const pageOf = (list: RoommateRequestRow[]) => list.slice(pageStart, pageStart + limit);
  const meta = { page: currentPage, limit, total, totalPages };

  return (
    <div className="space-y-6">
      <FilterSelect param="status" label="Status" allLabel="All statuses" options={STATUS_OPTIONS} />

      <Section
        title="Received"
        hint="Only you can answer a request that is still pending."
        count={received.length}
      >
        <DataTable
          columns={RECEIVED_COLUMNS}
          rows={pageOf(received)}
          getRowId={(row) => row.id}
          actions={(row) => (row.status === "PENDING" ? <RespondButtons request={row} /> : null)}
          empty={emptyFor("received", Boolean(status))}
          caption="Received roommate requests"
        />
      </Section>

      <Section title="Sent" hint="The other tenant answers. You are told when they do." count={sent.length}>
        <DataTable
          columns={SENT_COLUMNS}
          rows={pageOf(sent)}
          getRowId={(row) => row.id}
          empty={emptyFor("sent", Boolean(status))}
          caption="Sent roommate requests"
        />
      </Section>

      {total > 0 ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <Pagination meta={meta} />
        </div>
      ) : null}
    </div>
  );
}
