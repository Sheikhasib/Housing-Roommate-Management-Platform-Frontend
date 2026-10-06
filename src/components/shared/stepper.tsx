import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: readonly string[];
  /** 1-based current step. */
  current: number;
  label: string;
  className?: string;
}

/** Numbered circles joined by a line: done steps show a check, the current one is in primary. */
export function Stepper({ steps, current, label, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-2 sm:gap-3", className)} aria-label={label}>
      {steps.map((name, index) => {
        const number = index + 1;
        const done = current > number;
        const active = current === number;
        return (
          <li
            key={name}
            className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                done || active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : number}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "hidden text-muted-foreground sm:inline",
              )}
            >
              {name}
              {done ? <span className="sr-only"> (done)</span> : null}
            </span>
            {index < steps.length - 1 ? (
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
