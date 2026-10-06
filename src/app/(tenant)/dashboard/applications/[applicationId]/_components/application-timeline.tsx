import { Check, Circle, X } from "lucide-react";

import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TenantApplication } from "@/types/application";

type StepState = "done" | "current" | "upcoming" | "stopped";

interface Step {
  label: string;
  state: StepState;
  date?: string | null;
}

/**
 * Submitted, Approved, Deposit paid, Lease active (spec 08). A rejected, cancelled or expired
 * application stops after "Submitted" with one closing step, so it never looks half done.
 */
function buildSteps(application: TenantApplication): Step[] {
  const { status, payment, lease } = application;
  const submitted: Step = { label: "Submitted", state: "done", date: application.createdAt };

  if (status === "REJECTED") {
    return [submitted, { label: "Rejected", state: "stopped", date: application.reviewedAt }];
  }
  if (status === "CANCELLED") {
    return [submitted, { label: "Cancelled", state: "stopped", date: application.updatedAt }];
  }
  if (status === "EXPIRED") {
    return [submitted, { label: "Expired", state: "stopped", date: application.updatedAt }];
  }

  const approved = status === "APPROVED";
  const paid = payment?.status === "PAID";
  const hasLease = Boolean(lease);

  return [
    submitted,
    {
      label: "Approved",
      state: approved ? "done" : "current",
      date: approved ? application.reviewedAt : null,
    },
    {
      label: "Deposit paid",
      state: paid ? "done" : approved ? "current" : "upcoming",
      date: paid ? payment?.paidAt : null,
    },
    { label: "Lease active", state: hasLease ? "done" : paid ? "current" : "upcoming" },
  ];
}

const MARKER: Record<StepState, string> = {
  done: "border-success bg-success-bg text-success",
  current: "border-primary bg-card text-primary",
  upcoming: "border-border bg-card text-muted-foreground",
  stopped: "border-danger bg-danger-bg text-danger",
};

const STATE_TEXT: Record<StepState, string> = {
  done: "Done",
  current: "Next",
  upcoming: "Waiting",
  stopped: "Ended",
};

export function ApplicationTimeline({ application }: { application: TenantApplication }) {
  const steps = buildSteps(application);

  return (
    <ol className="space-y-0" aria-label="Application progress">
      {steps.map((step, index) => {
        const Icon = step.state === "done" ? Check : step.state === "stopped" ? X : Circle;
        const last = index === steps.length - 1;
        return (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  MARKER[step.state],
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              {last ? null : <span className="my-1 w-px grow bg-border" aria-hidden="true" />}
            </div>
            <div className={cn("min-w-0 pt-1", last ? "" : "pb-5")}>
              <p className="text-sm font-medium text-foreground">
                {step.label}
                <span className="sr-only"> ({STATE_TEXT[step.state]})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {step.date ? formatDate(step.date) : STATE_TEXT[step.state]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
