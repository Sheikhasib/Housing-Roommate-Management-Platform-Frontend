import { RoomCardSkeleton } from "@/components/shared/room-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomsGrid } from "./_components/rooms-grid";

export default function RoomsLoading() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-foreground">Browse rooms</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Find a room, bed or flat that fits your budget and move-in date.
        </p>
      </section>

      <div className="border-b border-border" aria-hidden="true">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Skeleton className="h-10 flex-1 rounded-lg sm:max-w-md" />
          <Skeleton className="ml-auto h-10 w-28 rounded-lg lg:hidden" />
          <Skeleton className="hidden h-10 w-44 rounded-lg sm:block" />
        </div>
      </div>

      <section
        className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:pb-16"
        aria-busy="true"
        aria-label="Loading rooms"
      >
        <Skeleton className="h-5 w-32" />
        <RoomsGrid>
          {Array.from({ length: 12 }, (_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </RoomsGrid>
      </section>
    </>
  );
}
