import { Skeleton } from "@/components/ui/skeleton";

/** Same size and layout as MatchCard. */
function MatchCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm" aria-hidden="true">
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-auto h-10 w-full rounded-lg" />
    </div>
  );
}

export function MatchesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <MatchCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function RequestsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-14 w-full sm:w-44" />
      <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 p-4">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Same layout as the page: header, tab list, then the Matches grid. */
export function RoommatesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full sm:w-96" />
      <MatchesSkeleton />
    </div>
  );
}

/** Rows for the Pairs and Memberships tabs. */
export function ListSkeleton({ rows = 4, withFilter = false }: { rows?: number; withFilter?: boolean }) {
  return (
    <div className="space-y-4" aria-busy="true">
      {withFilter ? <Skeleton className="h-14 w-full sm:w-44" /> : null}
      <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 p-4">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-9 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
