import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { RoomCard } from "@/components/shared/room-card";
import { Button } from "@/components/ui/button";
import { getPublicRooms } from "@/lib/api/rooms";
import { parseRoomsFilters, ROOMS_LIMIT_OPTIONS } from "@/validation/rooms-filter";
import { RoomsFilterBar } from "./_components/rooms-filter-bar";
import { RoomsGrid } from "./_components/rooms-grid";

export const metadata: Metadata = {
  title: "Browse rooms",
  description:
    "Search available rooms, beds and flats. Filter by city, room type, rent and furnishing, then view details and apply.",
};

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const filters = parseRoomsFilters(await searchParams);
  const { data: rooms, meta } = await getPublicRooms(filters);

  const hasFilters =
    Boolean(filters.searchTerm || filters.city || filters.type || filters.propertyType) ||
    filters.minRent !== undefined ||
    filters.maxRent !== undefined ||
    filters.isFurnished === true ||
    filters.availability !== "available";

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-foreground">Browse rooms</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Find a room, bed or flat that fits your budget and move-in date.
        </p>
      </section>

      <RoomsFilterBar filters={filters} />

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:pb-16">
        {rooms.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {meta.total} {meta.total === 1 ? "room" : "rooms"} found
            </p>
            <RoomsGrid>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </RoomsGrid>
            <Pagination meta={meta} limitOptions={ROOMS_LIMIT_OPTIONS} />
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title={hasFilters ? "No rooms match your filters" : "No rooms are listed right now"}
            description={
              hasFilters
                ? "Try a different city or room type, widen the rent range, or clear your filters."
                : "New rooms appear here as soon as owners publish them. Check back soon."
            }
            action={
              hasFilters ? (
                <Button asChild>
                  <Link href="/rooms">Clear filters</Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </section>
    </>
  );
}
