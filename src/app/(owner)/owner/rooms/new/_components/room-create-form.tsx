"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRoom } from "@/lib/api/ownerRoom";
import { CreateRoomZodSchema, EMPTY_ROOM_CREATE_VALUES, toCreateRoomPayload } from "@/validation/room";
import { RoomForm } from "../../_components/room-form";
import { roomsKey } from "../../_hooks/use-room-queries";

export function RoomCreateForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Room details</CardTitle>
        <CardDescription>
          The room starts unpublished. You add photos next, then publish it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RoomForm
          mode="create"
          initial={EMPTY_ROOM_CREATE_VALUES}
          submitLabel="Create room"
          pendingLabel="Creating room"
          onSubmit={async (value) => {
            const body = CreateRoomZodSchema.parse(toCreateRoomPayload(value));
            const response = await createRoom(body);
            toast.success(response.message);
            void queryClient.invalidateQueries({ queryKey: roomsKey() });
            router.replace(`/owner/rooms/${response.data.id}?tab=images&created=1`);
            return response.message;
          }}
        />
      </CardContent>
    </Card>
  );
}
