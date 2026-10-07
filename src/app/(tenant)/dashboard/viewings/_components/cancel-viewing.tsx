"use client";

import { Ban } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ViewingStatus } from "@/validation/enums";
import { useCancelViewing } from "../_hooks/use-viewing-queries";

/** The server lets a tenant cancel only these statuses (409 otherwise). */
const CANCELLABLE: readonly ViewingStatus[] = ["PENDING", "APPROVED"];

interface CancelViewingProps {
  viewingId: string;
  roomName: string;
  status: ViewingStatus;
}

export function CancelViewing({ viewingId, roomName, status }: CancelViewingProps) {
  const mutation = useCancelViewing();

  if (!CANCELLABLE.includes(status)) return null;

  const cancel = async () => {
    try {
      const response = await mutation.mutateAsync(viewingId);
      toast.success(response.message);
    } catch (error) {
      // The server message is shown as it comes, for example when the owner decided a moment earlier.
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <Can permission="viewings.cancel">
      <ConfirmDialog
        title="Cancel this viewing request?"
        description={`Your request to see ${roomName} is cancelled and the owner is told. This cannot be undone: to see the room later you would have to send a new request.`}
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        destructive
        onConfirm={cancel}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-error-text"
            aria-label={`Cancel viewing request for ${roomName}`}
          >
            <Ban aria-hidden="true" />
            Cancel
          </Button>
        }
      />
    </Can>
  );
}
