import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { TenantApplication } from "@/types/application";
import type { TenantInvoice } from "@/types/invoice";
import { RetryNotice } from "./retry-notice";

interface NextActionsProps {
  /** `null` means the list could not be loaded. */
  applications: TenantApplication[] | null;
  invoices: TenantInvoice[] | null;
  applicationsError?: string;
  invoicesError?: string;
}

interface ActionRowProps {
  title: string;
  meta: string;
  href: string;
  actionLabel: string;
}

function ActionRow({ title, meta, href, actionLabel }: ActionRowProps) {
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </li>
  );
}

export function NextActions({ applications, invoices, applicationsError, invoicesError }: NextActionsProps) {
  const allLoaded = applications !== null && invoices !== null;
  const nothingToDo = allLoaded && applications.length === 0 && invoices.length === 0;

  return (
    <section aria-labelledby="next-actions-title" className="space-y-3">
      <h2 id="next-actions-title" className="text-lg font-semibold text-foreground">
        Next actions
      </h2>

      {nothingToDo ? (
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title="You're all set"
            description="Nothing needs your attention right now."
            className="py-8"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {applicationsError ? (
            <RetryNotice title="Could not load your deposits" message={applicationsError} />
          ) : null}
          {invoicesError ? (
            <RetryNotice title="Could not load your invoices" message={invoicesError} />
          ) : null}

          {applications && applications.length > 0 ? (
            <Card>
              <CardContent>
                <h3 className="text-base font-semibold text-foreground">Deposits to pay</h3>
                <ul className="divide-y divide-border">
                  {applications.map((application) => (
                    <ActionRow
                      key={application.id}
                      title={application.room.name}
                      meta={`${application.room.property.title}, ${application.room.property.city} · Deposit ${formatMoney(application.room.bookingDeposit)}`}
                      href={`/dashboard/applications/${encodeURIComponent(application.id)}`}
                      actionLabel="Pay deposit"
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {invoices && invoices.length > 0 ? (
            <Card>
              <CardContent>
                <h3 className="text-base font-semibold text-foreground">Unpaid invoices</h3>
                <ul className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <ActionRow
                      key={invoice.id}
                      title={`${invoice.room.name}, ${invoice.room.property.title}`}
                      meta={`${formatMoney(invoice.amount)} · Due ${formatDate(invoice.dueDate)}`}
                      href="/dashboard/invoices"
                      actionLabel="Pay now"
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </section>
  );
}
