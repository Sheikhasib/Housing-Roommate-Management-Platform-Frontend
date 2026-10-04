import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeData } from "@/lib/api/home";
import { HomeSection, HomeSectionSkeleton, SectionError } from "./home-section";

const TITLE = "Popular cities";
const DESCRIPTION = "The cities with the most rooms listed right now.";

/** Six cards fill two even rows at 3 per row. */
const GRID = "grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3";

export function PopularCitiesSection({ cities }: { cities: HomeData["popularCities"] }) {
  return (
    <HomeSection
      title={TITLE}
      description={DESCRIPTION}
      tone="background"
      viewAll={{ href: "/rooms", label: "View all rooms" }}
    >
      {!cities.ok ? (
        <SectionError message="We could not load the popular cities. Refresh the page to try again." />
      ) : cities.data.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No cities to show yet"
          description="Cities appear here as soon as owners publish rooms."
        />
      ) : (
        <ul className={GRID}>
          {cities.data.map(({ city, roomCount, imageUrl }) => (
            <li key={city} className="h-full">
              <Link
                href={`/rooms?city=${encodeURIComponent(city)}`}
                className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm outline-none transition-shadow duration-150 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-accent text-accent-foreground">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`A property in ${city}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <MapPin className="size-8" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="block truncate px-1 text-base font-semibold text-foreground">
                  {city}
                </span>
                <span className="mt-auto flex items-center justify-between gap-2 px-1 text-sm font-medium text-primary">
                  {roomCount.toLocaleString("en-US")} {roomCount === 1 ? "room" : "rooms"}
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}

export function PopularCitiesSectionSkeleton() {
  return (
    <HomeSectionSkeleton tone="background">
      <div className={GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            <Skeleton className="mx-1 h-6 w-1/2" />
            <Skeleton className="mx-1 h-5 w-1/3" />
          </div>
        ))}
      </div>
    </HomeSectionSkeleton>
  );
}
