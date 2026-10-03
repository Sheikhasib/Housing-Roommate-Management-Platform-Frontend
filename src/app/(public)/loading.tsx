import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedRoomsSectionSkeleton } from "./_components/featured-rooms-section";
import { RoomTypeSectionSkeleton } from "./_components/room-type-section";
import { StatsStripSkeleton } from "./_components/stats-strip";

export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading the home page">
      <div
        className="relative h-[60vh] max-h-[70vh] overflow-hidden bg-muted md:h-[65vh]"
        aria-hidden="true"
      >
        <div className="mx-auto flex h-full max-w-7xl items-end px-4 pb-14 sm:px-6 lg:items-center lg:px-8 lg:pb-0">
          <div className="w-full space-y-3 rounded-xl border border-border bg-card p-4 shadow-md sm:p-6 lg:max-w-xl">
            <Skeleton className="h-7 w-4/5 sm:h-9" />
            <Skeleton className="hidden h-5 w-3/4 sm:block" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        </div>
      </div>
      <StatsStripSkeleton />
      <RoomTypeSectionSkeleton />
      <FeaturedRoomsSectionSkeleton />
    </div>
  );
}
