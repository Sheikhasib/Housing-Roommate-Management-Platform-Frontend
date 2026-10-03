import { RoomCardSkeleton } from "@/components/shared/room-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomsGrid } from "../_components/rooms-grid";

export default function RoomDetailLoading() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pb-16"
      aria-busy="true"
      aria-label="Loading room"
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-1/2 max-w-xs" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      <Skeleton className="aspect-4/3 w-full rounded-xl md:aspect-auto md:h-105" />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-10">
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-5/6 max-w-prose" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="hidden h-80 rounded-xl lg:block" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <RoomsGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </RoomsGrid>
      </div>
    </div>
  );
}
