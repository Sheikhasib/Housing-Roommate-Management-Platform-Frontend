import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { PublicPropertyDetailRoom } from "@/types/property";

const TILE_IMAGE_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/** Grid shared by the page and loading.tsx. */
export const PROPERTY_ROOMS_GRID =
  "grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/**
 * Compact tile for a raw Room row of the property detail. The row has no computed availability,
 * so beds free is `bedCount - occupiedBeds`. Fixed-height rows keep every tile the same size.
 */
export function PropertyRoomTile({ room }: { room: PublicPropertyDetailRoom }) {
  const image = room.images?.[0] ?? null;
  const bedsFree = Math.max(0, room.bedCount - room.occupiedBeds);
  const bedWord = room.bedCount === 1 ? "bed" : "beds";

  return (
    <article className="aura-glow relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-150 hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <div className="relative aspect-4/3 w-full shrink-0 bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={`Photo of ${room.name}`}
            fill
            sizes={TILE_IMAGE_SIZES}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">No photo available</span>
          </div>
        )}
        {room.status !== "AVAILABLE" ? (
          <div className="absolute top-3 left-3">
            <StatusBadge status={room.status} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="h-6 truncate text-base font-semibold text-foreground">
          <Link
            href={`/rooms/${room.id}`}
            className="outline-none after:absolute after:inset-0"
          >
            {room.name}
          </Link>
        </h3>
        <p className="h-5 truncate text-sm text-muted-foreground">
          {room.unit ? `Unit ${room.unit.label}` : ROOM_TYPE_LABELS[room.type]}
        </p>

        <div className="flex h-6 items-center gap-2">
          <Badge variant="secondary">{ROOM_TYPE_LABELS[room.type]}</Badge>
          {room.isFurnished ? <Badge variant="secondary">Furnished</Badge> : null}
        </div>

        <div className="flex h-6 items-baseline gap-1">
          <span className="text-base font-semibold text-foreground">
            {formatMoney(room.monthlyRent)}
          </span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
        <p className="h-5 text-sm text-muted-foreground">
          {bedsFree} of {room.bedCount} {bedWord} free
        </p>
      </div>
    </article>
  );
}

/** Same size and row heights as PropertyRoomTile. */
export function PropertyRoomTileSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      aria-hidden="true"
    >
      <Skeleton className="aspect-4/3 w-full shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-6 w-1/2 rounded-full" />
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}
