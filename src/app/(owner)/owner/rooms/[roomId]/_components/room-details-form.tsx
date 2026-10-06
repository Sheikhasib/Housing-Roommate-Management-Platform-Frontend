"use client";

import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRoom } from "@/lib/api/ownerRoom";
import type { OwnerRoomDetail } from "@/types/owner-room";
import {
  EMPTY_ROOM_CREATE_VALUES,
  UpdateRoomZodSchema,
  toUpdateRoomPayload,
  type RoomCreateValues,
} from "@/validation/room";
import { RoomForm } from "../../_components/room-form";
import { useRefreshRoom } from "../../_hooks/use-room-queries";

function toValues(room: OwnerRoomDetail): RoomCreateValues {
  return {
    ...EMPTY_ROOM_CREATE_VALUES,
    name: room.name,
    type: room.type,
    description: room.description ?? "",
    monthlyRent: String(Number(room.monthlyRent)),
    bookingDeposit: String(Number(room.bookingDeposit)),
    bedCount: String(room.bedCount),
    sizeSqft: room.sizeSqft === null ? "" : String(room.sizeSqft),
    minLeaseMonths: String(room.minLeaseMonths),
    isFurnished: room.isFurnished,
    amenities: room.amenities ?? [],
  };
}

export function RoomDetailsForm({ room }: { room: OwnerRoomDetail }) {
  const refresh = useRefreshRoom(room.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Room details</CardTitle>
        <CardDescription>
          Only the fields you change are sent. Status and publishing are on the Availability tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RoomForm
          mode="edit"
          initial={toValues(room)}
          submitLabel="Save changes"
          pendingLabel="Saving"
          onSubmit={async (value, initial) => {
            const body = UpdateRoomZodSchema.parse(toUpdateRoomPayload(value, initial));
            if (Object.keys(body).length === 0) return "No changes to save.";
            const response = await updateRoom(room.id, body);
            refresh();
            toast.success(response.message);
            return response.message;
          }}
        />
      </CardContent>
    </Card>
  );
}
