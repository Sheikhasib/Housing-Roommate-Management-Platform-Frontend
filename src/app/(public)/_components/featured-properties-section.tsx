import Link from "next/link";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PropertyCard } from "@/components/shared/property-card";
import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";
import { Button } from "@/components/ui/button";
import type { HomeData } from "@/lib/api/home";
import { HomeSection, HomeSectionSkeleton, SectionError } from "./home-section";

const TITLE = "Featured properties";
const DESCRIPTION = "Buildings with rooms you can book today.";

/** Six cards fill two even rows at 3 per row. */
const GRID = "grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function FeaturedPropertiesSection({
  properties,
}: {
  properties: HomeData["featuredProperties"];
}) {
  return (
    <HomeSection title={TITLE} description={DESCRIPTION} tone="card">
      {!properties.ok ? (
        <SectionError message="We could not load the featured properties. Refresh the page to try again." />
      ) : properties.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties are listed right now"
          description="Properties appear here as soon as an owner publishes a room."
          action={
            <Button asChild variant="outline">
              <Link href="/rooms">Browse all rooms</Link>
            </Button>
          }
        />
      ) : (
        <div className={GRID}>
          {properties.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </HomeSection>
  );
}

export function FeaturedPropertiesSectionSkeleton() {
  return (
    <HomeSectionSkeleton tone="card">
      <div className={GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    </HomeSectionSkeleton>
  );
}
