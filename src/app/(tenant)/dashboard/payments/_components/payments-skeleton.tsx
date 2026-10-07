import { Skeleton } from "@/components/ui/skeleton";

/** Same layout as PaymentsList: header, filter row, then one table card. */
export function PaymentsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-14 w-full sm:w-44" />
        <Skeleton className="h-14 w-full sm:w-44" />
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-9 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
