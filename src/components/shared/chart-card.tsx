"use client";

import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  /** Plain-language summary of the data, read by screen readers. */
  summary: string;
  /** Set when the data failed to load: shows a failure card instead of the chart. */
  errorMessage?: string;
  onRetry?: () => void;
  /** True when the data loaded but there is nothing to plot. */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  summary,
  errorMessage,
  onRetry,
  isEmpty,
  emptyTitle = "No data yet",
  emptyDescription,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {errorMessage ? (
          <ErrorState
            title="Could not load this chart"
            message={errorMessage}
            onRetry={onRetry}
            className="py-8"
          />
        ) : isEmpty ? (
          <EmptyState
            icon={BarChart3}
            title={emptyTitle}
            description={emptyDescription}
            className="py-8"
          />
        ) : (
          <>
            <p className="sr-only">{summary}</p>
            <div aria-hidden="true" className="h-64 w-full">
              {children}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ChartCardSkeleton() {
  return (
    <Card className="h-full" aria-hidden="true">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
