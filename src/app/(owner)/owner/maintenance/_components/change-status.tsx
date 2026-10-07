"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/shared/can";
import { FormError, FormField, firstError } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { plainMaintenanceError } from "@/lib/maintenance-labels";
import type { MaintenanceStatus } from "@/validation/enums";
import {
  buildStatusPayload,
  NEXT_STATUSES,
  UpdateMaintenanceStatusZodSchema,
  validateStatusForm,
  type StatusFormValues,
} from "@/validation/maintenance";
import { useUpdateMaintenanceStatus } from "../_hooks/use-owner-maintenance-queries";

const STATUS_NAMES: Record<MaintenanceStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const ACTION_LABELS: Record<MaintenanceStatus, string> = {
  OPEN: "Reopen",
  ASSIGNED: "Assign it",
  IN_PROGRESS: "Start work",
  RESOLVED: "Mark as resolved",
  CLOSED: "Close request",
};

function whatHappens(next: MaintenanceStatus, tenantName: string): string {
  const base = `The request moves to "${STATUS_NAMES[next]}" and ${tenantName} is told by email and in the app. It cannot be moved back.`;
  return next === "CLOSED" ? `${base} A closed request cannot be changed again.` : base;
}

interface StatusDialogProps {
  requestId: string;
  tenantName: string;
  next: MaintenanceStatus;
  onClose: () => void;
}

function StatusDialog({ requestId, tenantName, next, onClose }: StatusDialogProps) {
  const mutation = useUpdateMaintenanceStatus(requestId);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { assignedTo: "", resolutionNotes: "" } satisfies StatusFormValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateStatusForm(next, value);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const body = UpdateMaintenanceStatusZodSchema.parse(buildStatusPayload(next, value));
      try {
        const response = await mutation.mutateAsync(body);
        toast.success(response.message);
        onClose();
      } catch (error) {
        // 400, 403 and 409 messages are shown as they came; technical text becomes one plain sentence.
        const message = plainMaintenanceError(error);
        setServerError(message);
        toast.error(message);
      }
    },
  });

  const showNotes = next === "RESOLVED" || next === "CLOSED";

  return (
    <Dialog open onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
      <DialogContent>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{`Change status to "${STATUS_NAMES[next]}"?`}</DialogTitle>
            <DialogDescription>{whatHappens(next, tenantName)}</DialogDescription>
          </DialogHeader>

          <FormError message={serverError} />

          {next === "ASSIGNED" ? (
            <form.Field name="assignedTo">
              {(field) => (
                <FormField
                  id="maintenance-assigned-to"
                  label="Assigned to"
                  helper="Leave empty to assign it to yourself."
                  error={firstError(field.state.meta.errors)}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="assignedTo"
                      autoComplete="off"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        setServerError(null);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>
          ) : null}

          {showNotes ? (
            <form.Field name="resolutionNotes">
              {(field) => (
                <FormField
                  id="maintenance-resolution-notes"
                  label="Resolution notes"
                  required={next === "RESOLVED"}
                  helper={
                    next === "RESOLVED"
                      ? "Say what was done. The tenant can read this."
                      : "Optional. Notes already saved on the request are kept."
                  }
                  error={firstError(field.state.meta.errors)}
                >
                  {(control) => (
                    <Textarea
                      {...control}
                      name="resolutionNotes"
                      rows={4}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        setServerError(null);
                      }}
                    />
                  )}
                </FormField>
              )}
            </form.Field>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {ACTION_LABELS[next]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ChangeStatusProps {
  requestId: string;
  status: MaintenanceStatus;
  tenantName: string;
}

/** One button per status the workflow allows next. A closed request shows nothing. */
export function ChangeStatus({ requestId, status, tenantName }: ChangeStatusProps) {
  const [chosen, setChosen] = useState<MaintenanceStatus | null>(null);
  const options = NEXT_STATUSES[status];
  if (options.length === 0) return null;

  return (
    <Can permission="maintenance.manage">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Move this request forward</h3>
        <div className="flex flex-wrap gap-2">
          {options.map((next, index) => (
            <Button
              key={next}
              type="button"
              variant={index === 0 ? "default" : "outline"}
              onClick={() => setChosen(next)}
            >
              {ACTION_LABELS[next]}
            </Button>
          ))}
        </div>
      </section>
      {chosen ? (
        <StatusDialog
          key={chosen}
          requestId={requestId}
          tenantName={tenantName}
          next={chosen}
          onClose={() => setChosen(null)}
        />
      ) : null}
    </Can>
  );
}
