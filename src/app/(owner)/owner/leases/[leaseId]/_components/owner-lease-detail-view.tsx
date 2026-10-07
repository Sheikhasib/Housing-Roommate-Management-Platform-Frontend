"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import {
  TerminateLease,
  TerminationResultPanel,
  type TerminationOutcome,
} from "@/app/(tenant)/dashboard/leases/[leaseId]/_components/terminate-lease";
import { Can } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { gatewayLabel } from "@/lib/payment-labels";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { OwnerLeaseDetail } from "@/types/lease";
import { useOwnerLease } from "../../_hooks/use-owner-lease-queries";

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
      <dd className="text-sm break-words text-foreground">{children}</dd>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Owner only, and only when the response carries a payment: a manager's response has none. */
function DepositCard({ lease }: { lease: OwnerLeaseDetail }) {
  const payment = lease.application?.payment;
  if (!payment) return null;
  return (
    <Card title="Deposit">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Deposit amount">{formatMoney(lease.depositAmount)}</Fact>
        <Fact label="Payment status">
          <StatusBadge status={payment.status} />
        </Fact>
        <Fact label="Gateway">{gatewayLabel(payment.gateway)}</Fact>
        {payment.paidAt ? <Fact label="Paid on">{formatDateTime(payment.paidAt)}</Fact> : null}
        {payment.refundTrxId ? (
          <Fact label="Refund transaction id">{payment.refundTrxId}</Fact>
        ) : null}
        {payment.refundAmount ? (
          <Fact label="Refund amount">{formatMoney(payment.refundAmount)}</Fact>
        ) : null}
        {payment.refundAt ? (
          <Fact label="Refunded on">{formatDateTime(payment.refundAt)}</Fact>
        ) : null}
        {payment.refundReason ? (
          <Fact label="Refund reason">
            <span className="whitespace-pre-line">{payment.refundReason}</span>
          </Fact>
        ) : null}
      </dl>
      {payment.status === "REFUND_PENDING" ? (
        <p className="text-sm text-muted-foreground">
          A deposit refund is pending and is waiting to be settled by an admin.
        </p>
      ) : null}
    </Card>
  );
}

export function OwnerLeaseDetailView({ lease: initial }: { lease: OwnerLeaseDetail }) {
  const { data: lease } = useOwnerLease(initial.id, initial);
  const [outcome, setOutcome] = useState<TerminationOutcome | null>(null);
  const { room, tenantProfile: tenant } = lease;
  const { property } = room;
  const image = room.images?.[0] ?? property.images?.[0];
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const imageUrl = tenant.user?.imageUrl ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/owner/leases"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All leases
      </Link>

      <PageHeader
        title={`${tenant.name} in ${room.name}`}
        description={`${property.title}, ${property.city}`}
        action={
          <>
            <StatusBadge status={lease.status} />
            <TerminateLease
              lease={lease}
              viewer="owner"
              tenantName={tenant.name}
              onTerminated={setOutcome}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          {outcome ? <TerminationResultPanel outcome={outcome} /> : null}

          <Card title="Lease terms">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Monthly rent">{formatMoney(lease.monthlyRent)}</Fact>
              <Fact label="Start date">{formatDate(lease.startDate)}</Fact>
              <Fact label="End date">{formatDate(lease.endDate)}</Fact>
              <Fact label="Status">
                <StatusBadge status={lease.status} />
              </Fact>
              {lease.terminatedAt ? (
                <Fact label="Terminated on">{formatDate(lease.terminatedAt)}</Fact>
              ) : null}
              {lease.terminationReason ? (
                <Fact label="Termination reason">
                  <span className="whitespace-pre-line">{lease.terminationReason}</span>
                </Fact>
              ) : null}
            </dl>
          </Card>

          <Card title="Tenant">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={`Profile picture of ${tenant.name}`} />
                ) : null}
                <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 truncate text-base font-semibold text-foreground">
                {tenant.name}
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Email">{tenant.email}</Fact>
              <Fact label="Contact number">
                {tenant.contactNumber ?? <span className="text-muted-foreground">Not provided</span>}
              </Fact>
            </dl>
          </Card>

          <Can permission="payments.view">
            <DepositCard lease={lease} />
          </Can>
        </div>

        <aside
          aria-label="Room"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="relative aspect-[4/3] bg-muted">
            {image ? (
              <Image
                src={image.url}
                alt={`Photo of ${room.name}`}
                fill
                sizes="(min-width: 1024px) 22rem, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-3 p-5">
            <div className="space-y-1">
              <p className="truncate text-base font-semibold text-foreground">{room.name}</p>
              <p className="text-sm text-muted-foreground">{ROOM_TYPE_LABELS[room.type]}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {property.title}, {place}
                </span>
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/owner/rooms/${room.id}`}>Open room</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
