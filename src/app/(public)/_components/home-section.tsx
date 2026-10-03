import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HomeSectionProps {
  /** Anchor id, used by the hero's Explore link. */
  id?: string;
  title: string;
  description: string;
  /** Sections alternate between the page background and the card surface. */
  tone: "background" | "card";
  viewAll?: { href: string; label: string };
  children: ReactNode;
}

export function HomeSection({ id, title, description, tone, viewAll, children }: HomeSectionProps) {
  const headingId = `${id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-16 py-12 md:py-16",
        tone === "card" ? "border-y border-border bg-card" : "bg-background",
      )}
    >
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="space-y-1">
            <h2 id={headingId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
          {viewAll ? (
            <Link
              href={viewAll.href}
              className="inline-flex h-10 items-center gap-1 rounded-lg text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {viewAll.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Compact failure card for one section. The rest of the page keeps working. */
export function SectionError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 shadow-sm"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}

/** Title block placeholder for section skeletons in loading.tsx. */
export function HomeSectionSkeleton({
  tone,
  children,
}: {
  tone: "background" | "card";
  children: ReactNode;
}) {
  return (
    <section
      aria-hidden="true"
      className={cn(
        "py-12 md:py-16",
        tone === "card" ? "border-y border-border bg-card" : "bg-background",
      )}
    >
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
        {children}
      </div>
    </section>
  );
}
