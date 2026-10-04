import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedPropertiesSectionSkeleton } from "./_components/featured-properties-section";
import { FeaturedRoomsSectionSkeleton } from "./_components/featured-rooms-section";
import { PopularCitiesSectionSkeleton } from "./_components/popular-cities-section";
import { RoomTypeSectionSkeleton } from "./_components/room-type-section";
import { StatsStripSkeleton } from "./_components/stats-strip";

export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading the home page">
      <div className="bg-background pb-16 lg:pb-12" aria-hidden="true">
        <div className="relative z-10 h-[60vh] max-h-[70vh] bg-muted md:h-[65vh]">
          <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="pt-4 sm:pt-6 lg:pt-8">
              <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4 shadow-md sm:p-5">
                <Skeleton className="h-8 w-4/5 md:h-10" />
                <Skeleton className="hidden h-5 w-3/4 sm:block" />
              </div>
            </div>
            <div className="absolute inset-x-4 bottom-0 translate-y-1/2 sm:inset-x-6 lg:inset-x-8">
              <div className="rounded-xl border border-border bg-card p-3 shadow-md">
                <div className="flex gap-2 lg:gap-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="hidden h-10 flex-1 lg:block" />
                  <Skeleton className="hidden h-10 flex-1 lg:block" />
                  <Skeleton className="hidden h-10 w-32 lg:block" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StatsStripSkeleton />
      <RoomTypeSectionSkeleton />
      <FeaturedRoomsSectionSkeleton />
      <PopularCitiesSectionSkeleton />
      <FeaturedPropertiesSectionSkeleton />
    </div>
  );
}
