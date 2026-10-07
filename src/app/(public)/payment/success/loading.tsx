import { Skeleton } from "@/components/ui/skeleton";

/** Same shape as PaymentResultCard: icon, headline, summary rows, buttons. */
export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-[480px] space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
      aria-busy="true"
    >
      <Skeleton className="mx-auto size-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="mx-auto h-7 w-3/4" />
        <Skeleton className="mx-auto h-4 w-2/3" />
      </div>
      <Skeleton className="h-36 w-full rounded-lg" aria-hidden="true" />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Skeleton className="h-10 w-full sm:w-36" />
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
    </div>
  );
}
