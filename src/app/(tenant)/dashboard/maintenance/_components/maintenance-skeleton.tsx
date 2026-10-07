import { Skeleton } from "@/components/ui/skeleton";

/** Same layout as MaintenanceList: header with action, filter row, then one table card. */
export function MaintenanceSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-14 w-full sm:w-44" />
      <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 p-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-9 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
