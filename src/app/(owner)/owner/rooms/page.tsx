import type { Metadata } from "next";
import { Suspense } from "react";

import { RoomsList } from "./_components/rooms-list";
import { RoomsSkeleton } from "./_components/rooms-skeleton";

export const metadata: Metadata = {
  title: "Rooms",
  robots: { index: false },
};

export default function OwnerRoomsPage() {
  return (
    <Suspense fallback={<RoomsSkeleton />}>
      <RoomsList />
    </Suspense>
  );
}
