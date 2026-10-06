"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { TenantApplication } from "@/types/application";
import { useApplication } from "../../_hooks/use-application-queries";
import { ApplicationTimeline } from "./application-timeline";
import { CancelApplication } from "./cancel-application";

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

/** Deposit shown to the tenant: the room's booking deposit when above 0, otherwise one month's rent. */
function depositAmount(application: TenantApplication): string {
  return Number(application.room.bookingDeposit) > 0
    ? application.room.bookingDeposit
    : application.room.monthlyRent;
}

function DecisionText({ application }: { application: TenantApplication }) {
  switch (application.status) {
    case "PENDING":
      return (
        <p className="text-sm text-muted-foreground">
          The owner has not decided yet. Applications expire after 14 days without a decision.
        </p>
      );
    case "APPROVED":
      return (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">
            The owner approved your application
            {application.reviewedAt ? ` on ${formatDate(application.reviewedAt)}` : ""}.
          </p>
          <p className="text-muted-foreground">
            Booking deposit: {formatMoney(depositAmount(application))}. A lease is created when the
            deposit payment succeeds.
          </p>
        </div>
      );
    case "REJECTED":
      return (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">
            The owner rejected your application
            {application.reviewedAt ? ` on ${formatDate(application.reviewedAt)}` : ""}.
          </p>
          {application.rejectionReason ? (
            <p className="whitespace-pre-line text-muted-foreground">
              <span className="font-medium text-foreground">Reason: </span>
              {application.rejectionReason}
            </p>
          ) : null}
        </div>
      );
    case "CANCELLED":
      return <p className="text-sm text-muted-foreground">This application was cancelled.</p>;
    case "EXPIRED":
      return (
        <p className="text-sm text-muted-foreground">
          This application expired after 14 days without a decision.
        </p>
      );
  }
}

export function ApplicationDetailView({ application: initial }: { application: TenantApplication }) {
  const { data: application } = useApplication(initial.id, initial);
  const { room } = application;
  const { property } = room;
  const image = room.images?.[0] ?? property.images?.[0];
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const roomHref = `/rooms/${room.id}`;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/applications"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All applications
      </Link>

      <PageHeader
        title={`Application for ${room.name}`}
        description={`Sent on ${formatDate(application.createdAt)}`}
        action={
          <>
            <StatusBadge status={application.status} />
            <CancelApplication
              applicationId={application.id}
              roomName={room.name}
              status={application.status}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <Card title="Progress">
            <ApplicationTimeline application={application} />
          </Card>

          <Card title="Owner decision">
            <DecisionText application={application} />
            {application.status === "EXPIRED" ? (
              <Button asChild variant="outline">
                <Link href={roomHref}>Apply again</Link>
              </Button>
            ) : null}
          </Card>

          <Card title="Your application">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Move-in date">{formatDate(application.moveInDate)}</Fact>
              <Fact label="Lease length">
                {application.leaseMonths} {application.leaseMonths === 1 ? "month" : "months"}
              </Fact>
              <Fact label="Your message">
                {application.message ? (
                  <span className="whitespace-pre-line">{application.message}</span>
                ) : (
                  <span className="text-muted-foreground">No message</span>
                )}
              </Fact>
            </dl>
          </Card>
        </div>

        <aside aria-label="Room" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
            <p className="flex items-baseline gap-1">
              <span className="text-xl font-semibold text-foreground">
                {formatMoney(room.monthlyRent)}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={roomHref}>View room</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
