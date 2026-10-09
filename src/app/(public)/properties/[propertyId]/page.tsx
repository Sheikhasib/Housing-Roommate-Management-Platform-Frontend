import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DoorOpen, ExternalLink, MapPin } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { getPublicPropertyById } from "@/lib/api/property";
import { formatMoney } from "@/lib/format";
import { getMapHref } from "@/lib/map-link";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import type { PublicPropertyDetail } from "@/types/property";
import { RoomAmenities } from "../../rooms/[roomId]/_components/room-amenities";
import { RoomGallery } from "../../rooms/[roomId]/_components/room-gallery";
import { PROPERTY_ROOMS_GRID, PropertyRoomTile } from "./_components/property-room-tile";

/** One fetch per request, shared by generateMetadata and the page. Returns null on a 404. */
const loadProperty = cache(async (propertyId: string): Promise<PublicPropertyDetail | null> => {
  try {
    return await getPublicPropertyById(propertyId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
}: PageProps<"/properties/[propertyId]">): Promise<Metadata> {
  const { propertyId } = await params;
  const property = await loadProperty(propertyId);
  if (!property) return { title: "Property not found" };

  const title = `${property.title} in ${property.city}`;
  const description =
    property.description?.trim().slice(0, 160) ||
    `${PROPERTY_TYPE_LABELS[property.type]} in ${property.city} with ${property.rooms.length} ${property.rooms.length === 1 ? "room" : "rooms"} to book.`;
  const image = property.images?.[0];

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: image ? [{ url: image.url }] : [] },
  };
}

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-lg font-semibold text-foreground">
      {children}
    </h2>
  );
}

export default async function PropertyDetailPage({
  params,
}: PageProps<"/properties/[propertyId]">) {
  const { propertyId } = await params;
  const property = await loadProperty(propertyId);
  if (!property) notFound();

  const images = property.images ?? [];
  const amenities = property.amenities ?? [];
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const mapLink = getMapHref(property);
  const owner = property.owner;
  const ownerImage = owner?.user?.imageUrl ?? null;
  const startingRent = property.rooms[0]?.monthlyRent ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pb-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{property.title}</h1>
        <p className="flex items-center gap-1.5 text-base text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {place}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="info">{PROPERTY_TYPE_LABELS[property.type]}</Badge>
          <Badge variant="secondary">
            <DoorOpen aria-hidden="true" />
            {property.rooms.length} {property.rooms.length === 1 ? "room" : "rooms"}
          </Badge>
          {startingRent ? (
            <Badge variant="secondary">From {formatMoney(startingRent)} / month</Badge>
          ) : null}
        </div>
      </header>

      <RoomGallery roomName={property.title} images={images} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-10">
          <section aria-labelledby="overview" className="space-y-3">
            <SectionHeading id="overview">Overview</SectionHeading>
            {property.description ? (
              <p className="max-w-prose whitespace-pre-line text-base text-foreground">
                {property.description}
              </p>
            ) : (
              <p className="text-base text-muted-foreground">
                The owner has not added a description for this property yet.
              </p>
            )}
          </section>

          <section aria-labelledby="amenities" className="space-y-3">
            <SectionHeading id="amenities">Amenities</SectionHeading>
            {amenities.length > 0 ? (
              <RoomAmenities amenities={amenities} />
            ) : (
              <p className="text-base text-muted-foreground">No amenities are listed.</p>
            )}
          </section>

          <section aria-labelledby="house-rules" className="space-y-3">
            <SectionHeading id="house-rules">House rules</SectionHeading>
            {property.houseRules ? (
              <p className="max-w-prose whitespace-pre-line text-base text-foreground">
                {property.houseRules}
              </p>
            ) : (
              <p className="text-base text-muted-foreground">No house rules are listed.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section
            aria-labelledby="location"
            className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <SectionHeading id="location">Location</SectionHeading>
            <p className="text-base text-foreground">
              {[property.address, place].filter(Boolean).join(", ")}
            </p>
            {mapLink ? (
              <Button asChild variant="outline" className="w-full">
                <a href={mapLink} target="_blank" rel="noopener noreferrer">
                  Open in Google Maps
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">No map pin is set for this property.</p>
            )}
          </section>

          {owner ? (
            <section
              aria-labelledby="owner"
              className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <SectionHeading id="owner">Listed by</SectionHeading>
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  {ownerImage ? (
                    <Image
                      src={ownerImage}
                      alt={`Photo of ${owner.name}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      className="flex size-full items-center justify-center text-base font-semibold text-muted-foreground"
                      aria-hidden="true"
                    >
                      {owner.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{owner.name}</p>
                  {owner.companyName ? (
                    <p className="truncate text-sm text-muted-foreground">{owner.companyName}</p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <section aria-labelledby="rooms" className="space-y-4">
        <SectionHeading id="rooms">Rooms in this property</SectionHeading>
        {property.rooms.length > 0 ? (
          <div className={PROPERTY_ROOMS_GRID}>
            {property.rooms.map((room) => (
              <PropertyRoomTile key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={DoorOpen}
            title="No rooms are published yet"
            description="Rooms appear here as soon as the owner publishes them. Browse other rooms in the meantime."
            action={
              <Button asChild>
                <Link href="/rooms">Browse rooms</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
