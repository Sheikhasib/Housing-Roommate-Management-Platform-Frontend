import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { getRoomForOwnerSide } from "@/lib/api/ownerRoomServer";
import type { OwnerRoomDetail } from "@/types/owner-room";
import { RoomDetailView } from "./_components/room-detail-view";

export const metadata: Metadata = {
  title: "Room",
  robots: { index: false },
};

type Loaded = { room: OwnerRoomDetail } | { denied: string };

async function load(roomId: string): Promise<Loaded> {
  try {
    return { room: await getRoomForOwnerSide(roomId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    // The backend 403 message is shown as it comes.
    if (error instanceof ApiError && error.status === 403) {
      return { denied: error.errors[0]?.message || error.message };
    }
    throw error;
  }
}

export default async function OwnerRoomPage({ params }: PageProps<"/owner/rooms/[roomId]">) {
  const { roomId } = await params;
  const result = await load(roomId);

  if ("denied" in result) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You cannot open this room"
        description={result.denied}
        action={
          <Button asChild>
            <Link href="/owner/rooms">Back to rooms</Link>
          </Button>
        }
      />
    );
  }

  return <RoomDetailView room={result.room} />;
}
