import { Skeleton } from "@/components/ui/skeleton";

export function PaymentsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-10 w-full sm:w-72" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Skeleton className="h-10 w-full sm:w-44" />
        <Skeleton className="h-10 w-full sm:w-44" />
      </div>
      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
