import { Skeleton } from "@/components/ui/skeleton";

/** Same size and row heights as OwnedPropertyCard. */
export function OwnedPropertyCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-hidden="true"
    >
      <Skeleton className="aspect-4/3 w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-1/3 rounded-full" />
        <Skeleton className="mt-auto h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function PropertiesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full sm:w-44" />
      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <OwnedPropertyCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
