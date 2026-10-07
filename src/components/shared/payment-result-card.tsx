import type { ReactNode } from "react";
import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "neutral";

const TONES: Record<Tone, { icon: LucideIcon; circle: string }> = {
  success: { icon: CheckCircle2, circle: "bg-success-bg text-success" },
  info: { icon: Clock, circle: "bg-info-bg text-info" },
  neutral: { icon: XCircle, circle: "bg-muted text-muted-foreground" },
};

export interface PaymentResultRow {
  label: string;
  value: string;
}

interface PaymentResultCardProps {
  tone: Tone;
  title: string;
  description?: string;
  rows?: PaymentResultRow[];
  /** A primary and a secondary button. */
  actions?: ReactNode;
  className?: string;
}

/** Spec 18, payment return pages: a centered card with a status icon, a headline, a summary and actions. */
export function PaymentResultCard({
  tone,
  title,
  description,
  rows,
  actions,
  className,
}: PaymentResultCardProps) {
  const { icon: Icon, circle } = TONES[tone];
  return (
    <section
      aria-labelledby="payment-result-title"
      className={cn(
        "mx-auto w-full max-w-[480px] space-y-6 rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-8",
        className,
      )}
    >
      <div className={cn("mx-auto flex size-16 items-center justify-center rounded-full", circle)}>
        <Icon className="size-8" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 id="payment-result-title" className="text-2xl font-semibold text-foreground">
          {title}
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {rows && rows.length > 0 ? (
        <dl className="divide-y divide-border rounded-lg border border-border text-left text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 break-words text-right font-medium text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>
      ) : null}
    </section>
  );
}
