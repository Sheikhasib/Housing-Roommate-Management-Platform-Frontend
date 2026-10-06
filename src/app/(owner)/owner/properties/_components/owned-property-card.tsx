import Image from "next/image";
import Link from "next/link";
import { DoorOpen, ImageOff } from "lucide-react";

import { PROPERTY_CARD_IMAGE_SIZES } from "@/components/shared/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import type { OwnedPropertySummary } from "@/types/property";

/** Same fixed rows as PropertyCard: image, title, place, description, meta, button at the bottom. */
export function OwnedPropertyCard({ property }: { property: OwnedPropertySummary }) {
  const image = property.images?.[0] ?? null;
  const place = [property.area, property.city].filter(Boolean).join(", ");
  const roomCount = property._count.rooms;

  return (
    <article className="aura-glow relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-150 hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
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
            <span className="sr-only">No photo yet</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="info">{PROPERTY_TYPE_LABELS[property.type]}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="h-6 truncate text-base font-semibold text-foreground">{property.title}</h3>
        <p className="h-5 truncate text-sm text-muted-foreground">{place}</p>
        <p className="line-clamp-2 h-10 text-sm text-muted-foreground">
          {property.description ?? "No description yet."}
        </p>
        <div className="flex h-6 items-center gap-2">
          <Badge variant="secondary">
            <DoorOpen aria-hidden="true" />
            {roomCount} {roomCount === 1 ? "room" : "rooms"}
          </Badge>
        </div>
        <Button asChild variant="outline" className="mt-auto w-full">
          <Link href={`/owner/properties/${property.id}`} className="after:absolute after:inset-0">
            Manage property
            <span className="sr-only">: {property.title}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
