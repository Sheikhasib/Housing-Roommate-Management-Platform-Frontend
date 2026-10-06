"use client";

import { Ban } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus } from "@/validation/enums";
import { useCancelApplication } from "../../_hooks/use-application-queries";

/** The backend lets a tenant cancel only these statuses (409 otherwise). */
const CANCELLABLE: readonly ApplicationStatus[] = ["PENDING", "APPROVED"];

interface CancelApplicationProps {
  applicationId: string;
  roomName: string;
  status: ApplicationStatus;
}

export function CancelApplication({ applicationId, roomName, status }: CancelApplicationProps) {
  const mutation = useCancelApplication(applicationId);

  if (!CANCELLABLE.includes(status)) return null;

  const cancel = async () => {
    try {
      const response = await mutation.mutateAsync();
      toast.success(response.message);
    } catch (error) {
      // The backend message is shown as it comes, for example when a payment already exists.
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <Can permission="applications.cancel">
      <ConfirmDialog
        title="Cancel this application?"
        description={`Your application for ${roomName} is marked as cancelled and the owner no longer sees it as open. This cannot be undone: to rent the room later you would have to apply again.`}
        confirmLabel="Cancel application"
        cancelLabel="Keep application"
        destructive
        onConfirm={cancel}
        trigger={
          <Button type="button" variant="outline" className="text-error-text">
            <Ban aria-hidden="true" />
            Cancel application
          </Button>
        }
      />
    </Can>
  );
}
