"use client";

import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/app/(owner)/owner/properties/_hooks/use-property-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { MembershipRow } from "@/types/roommate";
import { useRespondMembership } from "../_hooks/use-roommate-queries";

interface AnswerButtonsProps {
  row: MembershipRow;
  /** Runs after a successful answer, e.g. to refresh server-loaded data. */
  onAnswered?: () => void;
  className?: string;
}

export function AnswerButtons({ row, onAnswered, className }: AnswerButtonsProps) {
  const respond = useRespondMembership();
  const name = row.holder.name;

  const answer = (action: "ACCEPT" | "DECLINE") => async () => {
    try {
      const response = await respond.mutateAsync({ id: row.id, body: { action } });
      toast.success(response.message);
    } catch (error) {
      // Guard messages (no longer pending, room already has a member) show as the server wrote them.
      toast.error(errorMessage(error));
      throw error;
    }
    onAnswered?.();
  };

  return (
    <div className={className ?? "flex flex-wrap justify-end gap-2"}>
      <ConfirmDialog
        title="Accept this invitation?"
        description={`You join ${row.room.name} at ${row.room.property.title} as a roommate member. You can report maintenance and see the room's utility bills. Rent stays with ${name}.`}
        confirmLabel="Accept"
        cancelLabel="Not now"
        onConfirm={answer("ACCEPT")}
        trigger={
          <Button type="button" size="sm" aria-label={`Accept invitation from ${name}`}>
            <Check aria-hidden="true" />
            Accept
          </Button>
        }
      />
      <ConfirmDialog
        title="Decline this invitation?"
        description={`${name} is told that you declined. They can invite you again later.`}
        confirmLabel="Decline"
        cancelLabel="Keep invitation"
        destructive
        onConfirm={answer("DECLINE")}
        trigger={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-error-text"
            aria-label={`Decline invitation from ${name}`}
          >
            <X aria-hidden="true" />
            Decline
          </Button>
        }
      />
    </div>
  );
}
