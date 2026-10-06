"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { Can } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { OwnerApplicationDetail } from "@/types/owner-application";
import { useOwnerApplication } from "../../_hooks/use-owner-application-queries";
import { OwnerApplicationTimeline } from "./owner-application-timeline";
import { ReviewApplication } from "./review-application";

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

function DecisionText({ application }: { application: OwnerApplicationDetail }) {
  const when = application.reviewedAt ? ` on ${formatDate(application.reviewedAt)}` : "";
  switch (application.status) {
    case "PENDING":
      return (
        <p className="text-sm text-muted-foreground">
          Waiting for a decision. Applications expire after 14 days without one.
        </p>
      );
    case "APPROVED":
      return (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">This application was approved{when}.</p>
          <p className="text-muted-foreground">
            The tenant can now pay the deposit; a lease is created when the payment succeeds.
          </p>
        </div>
      );
    case "REJECTED":
      return (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">This application was rejected{when}.</p>
          {application.rejectionReason ? (
            <p className="whitespace-pre-line text-muted-foreground">
              <span className="font-medium text-foreground">Reason: </span>
              {application.rejectionReason}
            </p>
          ) : null}
        </div>
      );
    case "CANCELLED":
      return <p className="text-sm text-muted-foreground">The tenant cancelled this application.</p>;
    case "EXPIRED":
      return (
        <p className="text-sm text-muted-foreground">
          This application expired after 14 days without a decision.
        </p>
      );
  }
}

export function OwnerApplicationDetailView({
  application: initial,
}: {
  application: OwnerApplicationDetail;
}) {
  const { data: application } = useOwnerApplication(initial.id, initial);
  const { room, tenantProfile: tenant } = application;
  const { property } = room;
  const image = room.images?.[0] ?? property.images?.[0];
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const imageUrl = tenant.user?.imageUrl ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/owner/applications"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All applications
      </Link>

      <PageHeader
        title={`${tenant.name} for ${room.name}`}
        description={`Sent on ${formatDate(application.createdAt)}`}
        action={
          <>
            <StatusBadge status={application.status} />
            <ReviewApplication
              applicationId={application.id}
              tenantName={tenant.name}
              roomName={room.name}
              status={application.status}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <Card title="Progress">
            <OwnerApplicationTimeline application={application} />
          </Card>

          <Card title="Decision">
            <DecisionText application={application} />
          </Card>

          <Card title="Application">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Move-in date">{formatDate(application.moveInDate)}</Fact>
              <Fact label="Lease length">
                {application.leaseMonths} {application.leaseMonths === 1 ? "month" : "months"}
              </Fact>
              {application.roommatePair ? (
                <Fact label="Roommate">Applied with a roommate</Fact>
              ) : null}
              <Fact label="Tenant message">
                {application.message ? (
                  <span className="whitespace-pre-line">{application.message}</span>
                ) : (
                  <span className="text-muted-foreground">No message</span>
                )}
              </Fact>
            </dl>
          </Card>

          <Card title="Applicant">
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
              <Fact label="Occupation">
                {tenant.occupation ?? <span className="text-muted-foreground">Not provided</span>}
              </Fact>
            </dl>
          </Card>

          <Can permission="payments.view">
            {application.payment ? (
              <Card title="Deposit payment">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={application.payment.status} />
                  {application.payment.paidAt ? (
                    <span className="text-sm text-muted-foreground">
                      Paid on {formatDate(application.payment.paidAt)}
                    </span>
                  ) : null}
                </div>
              </Card>
            ) : null}
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
            <p className="flex items-baseline gap-1">
              <span className="text-xl font-semibold text-foreground">
                {formatMoney(room.monthlyRent)}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/owner/rooms/${room.id}`}>Open room</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
