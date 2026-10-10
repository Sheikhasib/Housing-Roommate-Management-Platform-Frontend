"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";

import { AnswerButtons } from "@/app/(tenant)/dashboard/roommates/_components/answer-buttons";
import { PersonAvatar } from "@/app/(tenant)/dashboard/roommates/_components/match-card";
import { useMembershipUtilityBills } from "@/app/(tenant)/dashboard/roommates/_hooks/use-roommate-queries";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useSession";
import { formatDate, formatMoney } from "@/lib/format";
import { membershipDetails } from "@/lib/membership";
import type { MatchCardPerson, MembershipRow, UtilityBillRow } from "@/types/roommate";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function Person({ label, person, isMe }: { label: string; person: MatchCardPerson; isMe: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PersonAvatar person={person} className="size-11" />
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">
          {person.name}
          {isMe ? <span className="font-normal text-muted-foreground"> (you)</span> : null}
        </p>
        {person.occupation ? (
          <p className="truncate text-xs text-muted-foreground">{person.occupation}</p>
        ) : null}
      </div>
    </div>
  );
}

const BILL_COLUMNS: DataTableColumn<UtilityBillRow>[] = [
  {
    key: "period",
    header: "Period",
    cell: (bill) => `${formatDate(bill.periodStart)} to ${formatDate(bill.periodEnd)}`,
  },
  { key: "dueDate", header: "Due", cell: (bill) => formatDate(bill.dueDate) },
  { key: "amount", header: "Amount", cell: (bill) => formatMoney(bill.amount) },
  { key: "status", header: "Status", cell: (bill) => <StatusBadge status={bill.status} /> },
  {
    key: "description",
    header: "Description",
    wrap: true,
    cell: (bill) => <span className="line-clamp-2 break-words">{bill.description || "-"}</span>,
  },
];

function SplitLine({ label, amount }: { label: string; amount: string | number }) {
  const total = Number(amount);

  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium break-words text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">Full amount: {formatMoney(amount)}</p>
      </div>
      <p className="text-sm text-foreground sm:text-right">
        Equal split between 2 people:{" "}
        <span className="font-semibold">{formatMoney(total / 2)}</span>
      </p>
    </li>
  );
}

function CostSplit({
  membership,
  bills,
}: {
  membership: MembershipRow;
  bills: UtilityBillRow[] | undefined;
}) {
  if (membership.status !== "ACTIVE") {
    return (
      <p className="text-sm text-muted-foreground">
        The lease holder pays the rent and the bills.
      </p>
    );
  }

  const note =
    membership.role === "HOLDER"
      ? "You pay the rent and the bills to the owner. This is a suggested equal split to settle with your roommate directly; the app does not collect it."
      : "The lease holder pays the rent and the bills to the owner. This is a suggested equal split to settle with the holder directly; the app does not collect it.";

  return (
    <div className="space-y-2">
      <Card title="Cost split">
        <ul className="divide-y divide-border">
          <SplitLine label="Monthly rent" amount={membership.room.monthlyRent} />
          {bills?.map((bill) => (
            <SplitLine
              key={bill.id}
              label={`Utility bill, ${formatDate(bill.periodStart)} to ${formatDate(bill.periodEnd)}`}
              amount={bill.amount}
            />
          ))}
        </ul>
      </Card>
      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function UtilityBills({ membership }: { membership: MembershipRow }) {
  const bills = useMembershipUtilityBills(membership.id);

  return (
    <div className="space-y-6">
      <CostSplit membership={membership} bills={bills.data} />
    <section className="space-y-3" aria-label="Utility bills">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Utility bills</h2>
        <p className="text-sm text-muted-foreground">
          The utility bills of this lease&apos;s room. You see the amounts only, never payment details.
        </p>
      </div>
      {bills.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ) : bills.isError ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <ErrorState
            error={bills.error}
            title="Utility bills are not available"
            onRetry={() => void bills.refetch()}
          />
        </div>
      ) : (
        <DataTable
          columns={BILL_COLUMNS}
          rows={bills.data}
          getRowId={(bill) => bill.id}
          empty={{
            icon: ReceiptText,
            title: "No utility bills",
            description: "Bills for this room show up here once they are created.",
          }}
          caption="Utility bills of the membership lease"
        />
      )}
    </section>
    </div>
  );
}

export function MembershipDetailView({ membership }: { membership: MembershipRow }) {
  const { lease, room, holder, member } = membership;
  const { user } = useSession();
  const details = membershipDetails(membership, user?.id ?? null);
  const isHolder = membership.role === "HOLDER";
  const router = useRouter();
  const awaitingMyAnswer = membership.role === "MEMBER" && membership.status === "PENDING";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/roommates?tab=memberships"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All memberships
      </Link>

      <PageHeader
        title={`Roommate membership for ${room.name}`}
        description={`${room.property.title}, ${room.property.city}`}
        action={
          <>
            <Badge variant={isHolder ? "info" : "neutral"}>{isHolder ? "Holder" : "Member"}</Badge>
            <StatusBadge status={membership.status} />
            <span className="min-w-0 max-w-full text-sm break-words text-muted-foreground">{details}</span>
            {awaitingMyAnswer ? (
              <AnswerButtons
                row={membership}
                onAnswered={() => router.refresh()}
                className="flex flex-wrap gap-2"
              />
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Lease and room">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Room">{room.name}</Fact>
            <Fact label="Property">
              {room.property.title}, {room.property.city}
            </Fact>
            <Fact label="Room rent">{formatMoney(room.monthlyRent)}</Fact>
            <Fact label="Lease status">
              <StatusBadge status={lease.status} />
            </Fact>
            <Fact label="Lease starts">{formatDate(lease.startDate)}</Fact>
            <Fact label="Lease ends">{formatDate(lease.endDate)}</Fact>
          </dl>
        </Card>

        <Card title="People">
          <div className="space-y-4">
            <Person label="Lease holder" person={holder} isMe={isHolder} />
            <Person label="Roommate member" person={member} isMe={!isHolder} />
          </div>
          <dl className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Fact label="Invited">{formatDate(membership.createdAt)}</Fact>
            {membership.joinedAt ? <Fact label="Joined">{formatDate(membership.joinedAt)}</Fact> : null}
            {membership.removedAt ? <Fact label="Ended">{formatDate(membership.removedAt)}</Fact> : null}
            {membership.message ? (
              <Fact label="Invitation message">
                <span className="break-words whitespace-pre-line">{membership.message}</span>
              </Fact>
            ) : null}
          </dl>
        </Card>
      </div>

      <UtilityBills membership={membership} />
    </div>
  );
}
