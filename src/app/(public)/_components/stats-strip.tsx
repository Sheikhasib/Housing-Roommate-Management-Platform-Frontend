import { Building2, CircleCheck, DoorOpen, MapPin, SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import type { HomeData, SectionResult } from "@/lib/api/home";
import { HERO_NEXT_SECTION_ID } from "./hero-section";
import { HomeSection, HomeSectionSkeleton, SectionError } from "./home-section";

const TITLE = "Housing at a glance";
const DESCRIPTION = "Live numbers from the rooms and properties on the platform.";
const UNAVAILABLE = "Not available right now";

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

function display(result: SectionResult<number>): string {
  return result.ok ? result.data.toLocaleString("en-US") : "-";
}

interface StatsStripProps {
  stats: HomeData["stats"];
  cities: HomeData["cities"];
}

export function StatsStrip({ stats, cities }: StatsStripProps) {
  const cityCount: SectionResult<number> = cities.ok
    ? { ok: true, data: cities.data.length }
    : { ok: false };
  const results = [stats.roomsListed, stats.roomsAvailable, stats.properties, cityCount];

  const allFailed = results.every((result) => !result.ok);
  const allZero = results.every((result) => result.ok && result.data === 0);

  return (
    <HomeSection id={HERO_NEXT_SECTION_ID} title={TITLE} description={DESCRIPTION} tone="card">
      {allFailed ? (
        <SectionError message="We could not load the platform numbers. Refresh the page to try again." />
      ) : allZero ? (
        <EmptyState
          icon={SearchX}
          title="No rooms are listed yet"
          description="The numbers appear here as soon as owners publish their first rooms."
        />
      ) : (
        <div className={GRID}>
          <StatCard
            label="Rooms listed"
            value={display(stats.roomsListed)}
            icon={DoorOpen}
            hint={stats.roomsListed.ok ? "Published on the platform" : UNAVAILABLE}
          />
          <StatCard
            label="Available now"
            value={display(stats.roomsAvailable)}
            icon={CircleCheck}
            hint={stats.roomsAvailable.ok ? "Ready to move into" : UNAVAILABLE}
          />
          <StatCard
            label="Properties"
            value={display(stats.properties)}
            icon={Building2}
            hint={stats.properties.ok ? "With a published room" : UNAVAILABLE}
          />
          <StatCard
            label="Cities"
            value={display(cityCount)}
            icon={MapPin}
            hint={cityCount.ok ? "Where rooms are listed" : UNAVAILABLE}
          />
        </div>
      )}
    </HomeSection>
  );
}

export function StatsStripSkeleton() {
  return (
    <HomeSectionSkeleton tone="card">
      <div className={GRID}>
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    </HomeSectionSkeleton>
  );
}
