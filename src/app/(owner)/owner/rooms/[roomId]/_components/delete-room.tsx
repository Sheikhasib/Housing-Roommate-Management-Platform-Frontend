"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteRoom } from "@/lib/api/ownerRoom";
import { roomKey, roomsKey } from "../../_hooks/use-room-queries";

export function DeleteRoom({ roomId, name }: { roomId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const confirmDelete = async () => {
    try {
      const response = await deleteRoom(roomId);
      toast.success(response.message);
      queryClient.removeQueries({ queryKey: roomKey(roomId) });
      void queryClient.invalidateQueries({ queryKey: roomsKey() });
      router.replace("/owner/rooms");
    } catch (error) {
      // The backend refuses while a lease is active (409); its message is shown as it comes.
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <ConfirmDialog
      destructive
      title={`Delete ${name}?`}
      description="The room is deleted and set to unpublished, and it no longer appears in your rooms list. If the room has an active lease, the backend refuses and says why."
      confirmLabel="Delete room"
      onConfirm={confirmDelete}
      trigger={
        <Button variant="outline" className="text-error-text">
          <Trash2 aria-hidden="true" />
          Delete room
        </Button>
      }
    />
  );
}
