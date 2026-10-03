import { RoomCard } from "@/components/shared/room-card";
import type { PublicRoom } from "@/types/room";
import { RoomsGrid } from "../../_components/rooms-grid";

/** Renders nothing when there are no other rooms in the city. */
export function RelatedRooms({ rooms, city }: { rooms: PublicRoom[]; city: string }) {
  if (rooms.length === 0) return null;

  return (
    <section aria-labelledby="related-rooms" className="space-y-4">
      <h2 id="related-rooms" className="text-lg font-semibold text-foreground">
        Related rooms in {city}
      </h2>
      <RoomsGrid>
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </RoomsGrid>
    </section>
  );
}
