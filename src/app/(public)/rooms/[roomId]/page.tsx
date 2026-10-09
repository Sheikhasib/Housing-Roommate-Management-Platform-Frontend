import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ExternalLink, MapPin, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/apiError";
import { getPropertyLocation } from "@/lib/api/property";
import { getRelatedRooms, getRoomById } from "@/lib/api/rooms";
import { ACCESS_COOKIE } from "@/lib/auth/constants";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { formatDate, formatMoney } from "@/lib/format";
import { getMapHref } from "@/lib/map-link";
import { PROPERTY_TYPE_LABELS, ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { RoomDetail } from "@/types/room";
import { RelatedRooms } from "./_components/related-rooms";
import { RoomAmenities } from "./_components/room-amenities";
import { RoomBookingBar, RoomBookingCard } from "./_components/room-booking-card";
import { RoomGallery } from "./_components/room-gallery";
import { RoomKeyInfo } from "./_components/room-key-info";

/** One fetch per request, shared by generateMetadata and the page. Returns null on a 404. */
const loadRoom = cache(async (roomId: string): Promise<RoomDetail | null> => {
  try {
    return await getRoomById(roomId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

function roomImages(room: RoomDetail) {
  return room.images?.length ? room.images : (room.property.images ?? []);
}

export async function generateMetadata({
  params,
}: PageProps<"/rooms/[roomId]">): Promise<Metadata> {
  const { roomId } = await params;
  const room = await loadRoom(roomId);
  if (!room) return { title: "Room not found" };

  const title = `${room.name} in ${room.property.city}`;
  const description =
    room.description?.trim().slice(0, 160) ||
    `${ROOM_TYPE_LABELS[room.type]} in ${room.property.city} for ${formatMoney(room.monthlyRent)} a month.`;
  const image = roomImages(room)[0];

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

export default async function RoomDetailPage({ params }: PageProps<"/rooms/[roomId]">) {
  const { roomId } = await params;
  const room = await loadRoom(roomId);
  if (!room) notFound();

  const [session, related, location] = await Promise.all([
    cookies().then((store) => verifyAccessToken(store.get(ACCESS_COOKIE)?.value)),
    getRelatedRooms(room.property.city, room.id).catch(() => []),
    getPropertyLocation(room.property.id),
  ]);
  const role = session?.role ?? null;

  const { property } = room;
  const images = roomImages(room);
  const amenities = room.amenities ?? [];
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const mapLink = getMapHref(location);
  const owner = property.owner;
  const ownerImage = owner.user?.imageUrl ?? null;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">{room.name}</h1>
          <p className="flex items-center gap-1.5 text-base text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {property.title}, {place}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {room.availableNow ? (
              <Badge variant="success">Available now</Badge>
            ) : room.nextAvailableDate ? (
              <Badge variant="info">Available from {formatDate(room.nextAvailableDate)}</Badge>
            ) : (
              <Badge variant="neutral">Fully occupied</Badge>
            )}
            <Badge variant="secondary">{ROOM_TYPE_LABELS[room.type]}</Badge>
            {room.isFurnished ? <Badge variant="secondary">Furnished</Badge> : null}
          </div>
        </header>

        <RoomGallery roomName={room.name} images={images} />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-10">
            <section aria-labelledby="overview" className="space-y-3">
              <SectionHeading id="overview">Overview</SectionHeading>
              {room.description ? (
                <p className="max-w-prose whitespace-pre-line text-base text-foreground">
                  {room.description}
                </p>
              ) : (
                <p className="text-base text-muted-foreground">
                  The owner has not added a description for this room yet.
                </p>
              )}
            </section>

            <section aria-labelledby="key-information" className="space-y-3">
              <SectionHeading id="key-information">Key information</SectionHeading>
              <RoomKeyInfo room={room} />
            </section>

            <section aria-labelledby="amenities" className="space-y-3">
              <SectionHeading id="amenities">Amenities</SectionHeading>
              {amenities.length > 0 ? (
                <RoomAmenities amenities={amenities} />
              ) : (
                <p className="text-base text-muted-foreground">No amenities are listed.</p>
              )}
            </section>

            <section aria-labelledby="property-owner" className="space-y-3">
              <SectionHeading id="property-owner">Property and owner</SectionHeading>
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <p className="text-base font-semibold text-foreground">{property.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {PROPERTY_TYPE_LABELS[property.type]} in {property.city}
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-border pt-4">
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
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {owner.name}
                    </p>
                    {owner.companyName ? (
                      <p className="truncate text-sm text-muted-foreground">{owner.companyName}</p>
                    ) : null}
                    {/* Only APPROVED owners can create and publish rooms (backend rule), so every owner of a published room is verified. */}
                    <Badge variant="success">
                      <ShieldCheck aria-hidden="true" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="location" className="space-y-3">
              <SectionHeading id="location">Location</SectionHeading>
              <p className="text-base text-foreground">
                {[location?.address, place].filter(Boolean).join(", ")}
              </p>
              {mapLink ? (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-medium text-primary underline-offset-4 transition-colors duration-150 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Open in Google Maps
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </section>
          </div>

          <RoomBookingCard room={room} role={role} />
        </div>

        <RelatedRooms rooms={related} city={property.city} />
      </div>

      <RoomBookingBar room={room} role={role} />
    </>
  );
}
