import { Skeleton } from "@/components/ui/skeleton";

/** Same size and row heights as RoomCard. */
export function RoomCardSkeleton() {
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
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="mt-auto h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
