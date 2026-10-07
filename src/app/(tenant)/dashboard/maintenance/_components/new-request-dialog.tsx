"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { FileUploader } from "@/components/shared/file-uploader";
import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import { createMaintenanceRequest, uploadRequestPhoto } from "@/lib/api/maintenance";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  plainMaintenanceError,
  toOptions,
} from "@/lib/maintenance-labels";
import {
  DESCRIPTION_LIMIT,
  toCreateMaintenancePayload,
  validateCreateMaintenanceForm,
  type CreateMaintenanceFormValues,
} from "@/validation/maintenance";
import { useRefreshMaintenance, type RoomOption } from "../_hooks/use-maintenance-queries";
import { PhotoStep, type PhotoState } from "./photo-step";

const FIELDS = ["roomId", "category", "priority", "title", "description"] as const;
const CATEGORY_OPTIONS = toOptions(CATEGORY_LABELS);
const PRIORITY_OPTIONS = toOptions(PRIORITY_LABELS);

interface RequestFlowProps {
  rooms: RoomOption[];
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
}

function RequestFlow({ rooms, onClose, onLockChange }: RequestFlowProps) {
  const feedback = useActionFeedback();
  const refresh = useRefreshMaintenance();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [created, setCreated] = useState<{ id: string; message: string } | null>(null);
  const [photo, setPhoto] = useState<PhotoState>({ status: "none" });

  const defaultValues: CreateMaintenanceFormValues = {
    roomId: rooms.length === 1 ? rooms[0].id : "",
    category: "OTHER",
    priority: "MEDIUM",
    title: "",
    description: "",
  };

  /** Uploads the photo for a request that already exists. It never creates a request. */
  const sendPhoto = async (requestId: string, file: File) => {
    setPhoto({ status: "uploading", progress: 0 });
    onLockChange(true);
    try {
      const response = await uploadRequestPhoto(requestId, file, (progress) =>
        setPhoto({ status: "uploading", progress }),
      );
      setPhoto({ status: "done" });
      toast.success(response.message);
      refresh();
    } catch (error) {
      const message = plainMaintenanceError(error);
      setPhoto({ status: "failed", message });
      toast.error(message);
    } finally {
      onLockChange(false);
    }
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateCreateMaintenanceForm(value);
        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const payload = toCreateMaintenancePayload(value);
      if (!payload) return;
      try {
        const response = await createMaintenanceRequest(payload);
        setCreated({ id: response.data.id, message: response.message });
        toast.success(response.message);
        refresh();
        if (photoFile) void sendPhoto(response.data.id, photoFile);
      } catch (error) {
        // Guard messages (for example no active lease) show as the server wrote them.
        feedback.handleFailure(
          { ...toFormFailure(error), message: plainMaintenanceError(error) },
          FIELDS,
        );
      }
    },
  });

  if (created) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            {created.message}
          </DialogTitle>
          <DialogDescription>
            Your owner has been told. You can follow this request in your list.
          </DialogDescription>
        </DialogHeader>
        <PhotoStep
          state={photo}
          onRetry={() => {
            if (photoFile) void sendPhoto(created.id, photoFile);
          }}
        />
        <DialogFooter>
          <Button type="button" onClick={onClose} disabled={photo.status === "uploading"}>
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
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
        <DialogTitle>New request</DialogTitle>
        <DialogDescription>
          Tell your owner what needs fixing. You can add one photo to help them see the problem.
        </DialogDescription>
      </DialogHeader>

      <FormError message={feedback.formError} />

      <form.Field name="roomId">
        {(field) => (
          <FormField
            id="maintenance-room"
            label="Room"
            required
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.roomId}
          >
            {(control) => (
              <Select
                value={field.state.value}
                onValueChange={(value) => {
                  feedback.clearField("roomId");
                  field.handleChange(value);
                }}
              >
                <SelectTrigger {...control} className="w-full" onBlur={field.handleBlur}>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="category">
          {(field) => (
            <FormField
              id="maintenance-category"
              label="Type of problem"
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.category}
            >
              {(control) => (
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    feedback.clearField("category");
                    field.handleChange(value);
                  }}
                >
                  <SelectTrigger {...control} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}
        </form.Field>

        <form.Field name="priority">
          {(field) => (
            <FormField
              id="maintenance-priority"
              label="How urgent is it?"
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.priority}
            >
              {(control) => (
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    feedback.clearField("priority");
                    field.handleChange(value);
                  }}
                >
                  <SelectTrigger {...control} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="title">
        {(field) => (
          <FormField
            id="maintenance-title"
            label="Title"
            required
            helper="A short summary, 3 to 100 characters."
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.title}
          >
            {(control) => (
              <Input
                {...control}
                name="title"
                autoComplete="off"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("title");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FormField
            id="maintenance-description"
            label="Details (optional)"
            helper={`${field.state.value.length} of ${DESCRIPTION_LIMIT} characters`}
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.description}
          >
            {(control) => (
              <Textarea
                {...control}
                name="description"
                rows={4}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("description");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Photo (optional)</p>
        <FileUploader
          kind="image"
          fieldName="image"
          label="Add a photo of the problem"
          onFilesChange={(files) => setPhotoFile(files[0] ?? null)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <SubmitButton
              pending={isSubmitting}
              cooldownSeconds={feedback.cooldownSeconds}
              label="Send request"
              pendingLabel="Sending"
              className="sm:w-auto"
            />
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: RoomOption[];
}

export function NewRequestDialog({ open, onOpenChange, rooms }: NewRequestDialogProps) {
  // While the photo uploads the dialog stays open, so the progress and the retry are never lost.
  const [locked, setLocked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => (next || !locked) && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <RequestFlow rooms={rooms} onClose={() => onOpenChange(false)} onLockChange={setLocked} />
      </DialogContent>
    </Dialog>
  );
}
