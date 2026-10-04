import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, BedSingle, Building, SearchX, Users, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeData } from "@/lib/api/home";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import { ROOM_TYPES, type RoomType } from "@/validation/enums";
import { HomeSection, HomeSectionSkeleton, SectionError } from "./home-section";

const TITLE = "Browse by room type";
const DESCRIPTION = "Choose the kind of space that suits how you want to live.";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

const TYPE_INFO: Record<RoomType, { icon: LucideIcon; description: string }> = {
  PRIVATE_ROOM: { icon: BedDouble, description: "A room of your own inside a shared home." },
  SHARED_ROOM: { icon: Users, description: "Share a room with others and split the rent." },
  ENTIRE_FLAT: { icon: Building, description: "A whole flat for you or your group." },
  BED: { icon: BedSingle, description: "A single bed in a shared room." },
};

function countLabel(result: HomeData["roomTypeCounts"][RoomType]): string {
  if (!result.ok) return "Count not available right now";
  return `${result.data.count.toLocaleString("en-US")} available now`;
}

export function RoomTypeSection({ counts }: { counts: HomeData["roomTypeCounts"] }) {
  const results = ROOM_TYPES.map((type) => counts[type]);
  const allFailed = results.every((result) => !result.ok);
  const allZero = results.every((result) => result.ok && result.data.count === 0);

  return (
    <HomeSection
      title={TITLE}
      description={DESCRIPTION}
      tone="background"
      viewAll={{ href: "/rooms", label: "View all rooms" }}
    >
      {allFailed ? (
        <SectionError message="We could not load the room types. Refresh the page to try again." />
      ) : allZero ? (
        <EmptyState
          icon={SearchX}
          title="No rooms are available right now"
          description="Room types show up here as soon as owners publish rooms."
        />
      ) : (
        <ul className={GRID}>
          {ROOM_TYPES.map((type) => {
            const { icon: Icon, description } = TYPE_INFO[type];
            const result = counts[type];
            const imageUrl = result.ok ? result.data.imageUrl : null;
            return (
              <li key={type} className="h-full">
                <Link
                  href={`/rooms?type=${type}`}
                  className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm outline-none transition-shadow duration-150 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-accent text-accent-foreground">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`A ${ROOM_TYPE_LABELS[type].toLowerCase()} on the platform`}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center">
                        <Icon className="size-8" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="block truncate px-1 text-base font-semibold text-foreground">
                    {ROOM_TYPE_LABELS[type]}
                  </span>
                  <span className="line-clamp-1 px-1 text-sm text-muted-foreground">
                    {description}
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 px-1 pt-1 text-sm font-medium text-primary">
                    {countLabel(result)}
                    <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
}

export function RoomTypeSectionSkeleton() {
  return (
    <HomeSectionSkeleton tone="background">
      <div className={GRID}>
        {ROOM_TYPES.map((type) => (
          <div
            key={type}
            className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            <Skeleton className="mx-1 h-6 w-1/2" />
            <Skeleton className="mx-1 h-5" />
            <Skeleton className="mx-1 mt-auto h-5 w-2/3" />
          </div>
        ))}
      </div>
    </HomeSectionSkeleton>
  );
}
