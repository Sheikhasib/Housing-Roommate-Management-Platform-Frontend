import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PropertyCard } from "@/components/shared/property-card";
import { Button } from "@/components/ui/button";
import { getPublicProperties } from "@/lib/api/property";
import { PROPERTIES_LIMIT_OPTIONS, parsePropertiesFilters } from "@/validation/properties-filter";
import { PropertiesFilterBar } from "./_components/properties-filter-bar";
import { PropertiesGrid } from "./_components/properties-grid";

export const metadata: Metadata = {
  title: "Browse properties",
  description:
    "Explore apartments, hostels, villas and shared houses with rooms you can book. Filter by city and property type, then view the rooms inside.",
};

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const filters = parsePropertiesFilters(await searchParams);
  const { data: properties, meta } = await getPublicProperties(filters);

  const hasFilters = Boolean(filters.searchTerm || filters.city || filters.type);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-foreground">Browse properties</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Find a building you like, then pick a room inside it.
        </p>
      </section>

      <PropertiesFilterBar filters={filters} />

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:pb-16">
        {properties.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {meta.total} {meta.total === 1 ? "property" : "properties"} found
            </p>
            <PropertiesGrid>
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </PropertiesGrid>
            <Pagination meta={meta} limitOptions={PROPERTIES_LIMIT_OPTIONS} />
          </>
        ) : (
          <EmptyState
            icon={Building2}
            title={
              hasFilters ? "No properties match your filters" : "No properties are listed right now"
            }
            description={
              hasFilters
                ? "Try a different city or property type, or clear your filters."
                : "Properties appear here as soon as an owner publishes a room. Check back soon."
            }
            action={
              hasFilters ? (
                <Button asChild>
                  <Link href="/properties">Clear filters</Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/rooms">Browse rooms</Link>
                </Button>
              )
            }
          />
        )}
      </section>
    </>
  );
}
