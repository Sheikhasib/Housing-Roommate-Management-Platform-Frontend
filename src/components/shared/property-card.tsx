import Image from "next/image";
import Link from "next/link";
import { Building2, DoorOpen, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import type { PublicPropertySummary } from "@/types/property";

export const PROPERTY_CARD_IMAGE_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

interface PropertyCardProps {
  property: PublicPropertySummary;
}

/** Same fixed-height rows as RoomCard; PropertyCardSkeleton mirrors them. */
export function PropertyCard({ property }: PropertyCardProps) {
  const image = property.images?.[0] ?? null;
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const owner = property.owner.companyName || property.owner.name;
  const roomCount = property._count.rooms;
  const startingRent = property.rooms[0]?.monthlyRent ?? null;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-150 hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <div className="relative aspect-4/3 w-full shrink-0 bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={`Photo of ${property.title}`}
            fill
            sizes={PROPERTY_CARD_IMAGE_SIZES}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">No photo available</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="info">{PROPERTY_TYPE_LABELS[property.type]}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="h-6 truncate text-base font-semibold text-foreground">{property.title}</h3>
        <p className="h-5 truncate text-sm text-muted-foreground">{place}</p>
        <p className="line-clamp-2 h-10 text-sm text-muted-foreground">{property.description}</p>

        <div className="flex h-6 items-center gap-2">
          <Badge variant="secondary" className="max-w-[60%]">
            <Building2 aria-hidden="true" />
            <span className="truncate">{owner}</span>
          </Badge>
          <Badge variant="secondary">
            <DoorOpen aria-hidden="true" />
            {roomCount} {roomCount === 1 ? "room" : "rooms"}
          </Badge>
        </div>

        <div className="flex h-6 items-baseline gap-1">
          {startingRent ? (
            <>
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-base font-semibold text-foreground">
                {formatMoney(startingRent)}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </>
          ) : null}
        </div>

        <Button asChild variant="outline" className="mt-auto w-full">
          <Link
            href={`/rooms?city=${encodeURIComponent(property.city)}`}
            className="after:absolute after:inset-0"
          >
            View rooms
            <span className="sr-only"> in {property.title}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
