"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REASON_LIMIT, toRemovePayload } from "@/validation/roommate";
import { useRemoveMembership } from "../_hooks/use-roommate-queries";

interface RemoveMembershipDialogProps {
  membershipId: string;
  title: string;
  description: string;
  confirmLabel: string;
  trigger: ReactNode;
}

/** Holder-side removal with an optional reason (max 300). */
export function RemoveMembershipDialog({
  membershipId,
  title,
  description,
  confirmLabel,
  trigger,
}: RemoveMembershipDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const remove = useRemoveMembership();

  const payload = toRemovePayload(reason);
  const tooLong = reason.trim().length > REASON_LIMIT;
  const fieldId = `remove-reason-${membershipId}`;

  const confirm = async () => {
    if (!payload) return;
    try {
      const response = await remove.mutateAsync({ id: membershipId, body: payload });
      toast.success(response.message);
      setReason("");
    } catch (error) {
      // Guard messages (not the holder, already removed) show as the server wrote them.
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel="Keep it"
      destructive
      confirmDisabled={!payload}
      onConfirm={confirm}
      trigger={trigger}
    >
      <div className="space-y-1.5">
        <Label htmlFor={fieldId}>Reason (optional)</Label>
        <Textarea
          id={fieldId}
          rows={3}
          value={reason}
          aria-invalid={tooLong}
          aria-describedby={`${fieldId}-help`}
          onChange={(event) => setReason(event.target.value)}
        />
        <p id={`${fieldId}-help`} className={tooLong ? "text-xs text-error-text" : "text-xs text-muted-foreground"}>
          {tooLong
            ? "Reason must be at most 300 characters"
            : `${reason.length} of ${REASON_LIMIT} characters`}
        </p>
      </div>
    </ConfirmDialog>
  );
}
