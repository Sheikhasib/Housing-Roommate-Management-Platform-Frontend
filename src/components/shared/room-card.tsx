import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { ROOM_TYPE_LABELS } from "@/lib/room-labels";
import type { PublicRoom } from "@/types/room";

export const ROOM_CARD_IMAGE_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

function AvailabilityBadge({ room }: { room: PublicRoom }) {
  if (room.availableNow) {
    return <Badge variant="success">Available now</Badge>;
  }
  if (room.nextAvailableDate) {
    return <Badge variant="info">Available from {formatDate(room.nextAvailableDate)}</Badge>;
  }
  return <Badge variant="neutral">Fully occupied</Badge>;
}

interface RoomCardProps {
  room: PublicRoom;
}

/** Fixed-height rows keep every card the same size; RoomCardSkeleton mirrors them. */
export function RoomCard({ room }: RoomCardProps) {
  const image = room.images?.[0] ?? room.property.images?.[0] ?? null;
  const place = [room.property.title, room.property.city].filter(Boolean).join(", ");
  const bedWord = room.bedCount === 1 ? "bed" : "beds";

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-150 hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <div className="relative aspect-4/3 w-full shrink-0 bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={`Photo of ${room.name}`}
            fill
            sizes={ROOM_CARD_IMAGE_SIZES}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">No photo available</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <AvailabilityBadge room={room} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="h-6 truncate text-base font-semibold text-foreground">{room.name}</h3>
        <p className="h-5 truncate text-sm text-muted-foreground">{place}</p>
        <p className="line-clamp-2 h-10 text-sm text-muted-foreground">{room.description}</p>

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
          {room.availableBeds} of {room.bedCount} {bedWord} free
        </p>

        <Button asChild variant="outline" className="mt-auto w-full">
          <Link href={`/rooms/${room.id}`} className="after:absolute after:inset-0">
            View details
            <span className="sr-only"> for {room.name}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}
