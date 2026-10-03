import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { RoomCard } from "@/components/shared/room-card";
import { RoomCardSkeleton } from "@/components/shared/room-card-skeleton";
import { Button } from "@/components/ui/button";
import type { HomeData } from "@/lib/api/home";
import { HomeSection, HomeSectionSkeleton, SectionError } from "./home-section";

const TITLE = "Featured rooms";
const DESCRIPTION = "The newest rooms from verified owners.";

/** Six cards fill two even rows at 3 per row, so there is no 4-column step here. */
const GRID = "grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function FeaturedRoomsSection({ rooms }: { rooms: HomeData["featuredRooms"] }) {
  return (
    <HomeSection
      title={TITLE}
      description={DESCRIPTION}
      tone="card"
      viewAll={{ href: "/rooms", label: "View all rooms" }}
    >
      {!rooms.ok ? (
        <SectionError message="We could not load the featured rooms. Refresh the page to try again." />
      ) : rooms.data.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No rooms are listed right now"
          description="New rooms appear here as soon as owners publish them. Check back soon."
          action={
            <Button asChild variant="outline">
              <Link href="/rooms">Browse all rooms</Link>
            </Button>
          }
        />
      ) : (
        <div className={GRID}>
          {rooms.data.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </HomeSection>
  );
}

export function FeaturedRoomsSectionSkeleton() {
  return (
    <HomeSectionSkeleton tone="card">
      <div className={GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <RoomCardSkeleton key={index} />
        ))}
      </div>
    </HomeSectionSkeleton>
  );
}
