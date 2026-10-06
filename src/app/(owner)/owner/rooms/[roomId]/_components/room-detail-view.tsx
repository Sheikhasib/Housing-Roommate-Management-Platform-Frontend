"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Can } from "@/components/shared/can";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/useUrlState";
import type { OwnerRoomDetail } from "@/types/owner-room";
import { useOwnerRoom } from "../../_hooks/use-room-queries";
import { DeleteRoom } from "./delete-room";
import { RoomAvailability } from "./room-availability";
import { RoomDetailsForm } from "./room-details-form";
import { RoomImages } from "./room-images";

const TABS = ["details", "availability", "images"] as const;
type TabValue = (typeof TABS)[number];

function isTab(value: string): value is TabValue {
  return (TABS as readonly string[]).includes(value);
}

export function RoomDetailView({ room: initial }: { room: OwnerRoomDetail }) {
  const { data: room } = useOwnerRoom(initial.id, initial);
  const { getParam, setParams } = useUrlState();
  const requested = getParam("tab");
  const tab: TabValue = isTab(requested) ? requested : "details";

  return (
    <div className="space-y-6">
      <Link
        href="/owner/rooms"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All rooms
      </Link>

      <PageHeader
        title={room.name}
        description={[room.property.title, room.property.city].filter(Boolean).join(", ")}
        action={
          <>
            <StatusBadge status={room.status} />
            <Can permission="rooms.createDelete">
              <DeleteRoom roomId={room.id} name={room.name} />
            </Can>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value, created: null })}>
        <TabsList className="h-auto w-full justify-start sm:w-fit">
          <TabsTrigger value="details" className="min-h-10 px-4">
            Details
          </TabsTrigger>
          <TabsTrigger value="availability" className="min-h-10 px-4">
            Availability
          </TabsTrigger>
          <TabsTrigger value="images" className="min-h-10 px-4">
            Images
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          <RoomDetailsForm room={room} />
        </TabsContent>
        <TabsContent value="availability" className="pt-4">
          <RoomAvailability room={room} />
        </TabsContent>
        <TabsContent value="images" className="pt-4">
          <RoomImages room={room} showCreatedHint={getParam("created") === "1"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
