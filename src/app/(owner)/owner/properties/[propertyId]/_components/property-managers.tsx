"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, Users } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/shared/can";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { ProfileFormStatus } from "@/components/shared/profile-form-status";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { assignManager, removeManager } from "@/lib/api/ownerProperty";
import { toFormFailure } from "@/lib/api/formFailure";
import { formatDate } from "@/lib/format";
import type { PropertyManagerRow } from "@/types/property";
import { AssignManagerZodSchema, toFieldErrors } from "@/validation/property";
import {
  errorMessage,
  propertyManagersKey,
  usePropertyManagers,
} from "../../_hooks/use-property-queries";

function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return letters.join("").toUpperCase() || "?";
}

function AssignManagerForm({ propertyId }: { propertyId: string }) {
  const feedback = useActionFeedback();
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (managerEmail: string) => assignManager(propertyId, managerEmail),
  });

  const form = useForm({
    defaultValues: { managerEmail: "" },
    validators: {
      onSubmit: ({ value }) => {
        const result = AssignManagerZodSchema.safeParse({ managerEmail: value.managerEmail.trim() });
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSavedMessage(null);
      try {
        const response = await mutation.mutateAsync(value.managerEmail.trim());
        void queryClient.invalidateQueries({ queryKey: propertyManagersKey(propertyId) });
        form.reset();
        setSavedMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        // "Manager not found" and "Manager is already assigned to this property" arrive verbatim.
        feedback.handleFailure(toFormFailure(error), ["managerEmail"]);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Assign a manager</CardTitle>
        <CardDescription>
          Enter the email of an active property manager account. They are notified when assigned.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <ProfileFormStatus savedMessage={savedMessage} errorMessage={feedback.formError} />
          <form.Field name="managerEmail">
            {(field) => (
              <FormField
                id="manager-email"
                label="Manager email"
                error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.managerEmail}
              >
                {(control) => (
                  <Input
                    {...control}
                    name="managerEmail"
                    type="email"
                    autoComplete="off"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      feedback.clearField("managerEmail");
                      setSavedMessage(null);
                      field.handleChange(event.target.value);
                    }}
                  />
                )}
              </FormField>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
            {([isSubmitting, isDefaultValue]) => (
              <div className="flex justify-end">
                <SubmitButton
                  pending={isSubmitting}
                  disabled={isDefaultValue}
                  cooldownSeconds={feedback.cooldownSeconds}
                  label="Assign manager"
                  pendingLabel="Assigning"
                  className="sm:w-auto sm:min-w-44"
                />
              </div>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}

function ManagerItem({ row, propertyId }: { row: PropertyManagerRow; propertyId: string }) {
  const queryClient = useQueryClient();
  const { manager } = row;

  const confirmRemove = async () => {
    try {
      const response = await removeManager(propertyId, row.managerId);
      toast.success(response.message);
      void queryClient.invalidateQueries({ queryKey: propertyManagersKey(propertyId) });
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-10">
          {manager.user.imageUrl ? (
            <AvatarImage src={manager.user.imageUrl} alt={`${manager.name} profile photo`} />
          ) : null}
          <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium text-foreground">{manager.name}</p>
          <p className="truncate text-sm text-muted-foreground">{manager.email}</p>
          {manager.contactNumber ? (
            <p className="truncate text-sm text-muted-foreground">{manager.contactNumber}</p>
          ) : null}
          {manager.bio ? <p className="text-sm text-muted-foreground">{manager.bio}</p> : null}
          <p className="text-xs text-muted-foreground">Assigned {formatDate(row.assignedAt)}</p>
        </div>
      </div>
      <Can permission="managers.assign">
        <ConfirmDialog
          destructive
          title={`Remove ${manager.name} from this property?`}
          description={`${manager.name} is removed from this property and is notified. Rooms and units are not changed.`}
          confirmLabel="Remove manager"
          onConfirm={confirmRemove}
          trigger={
            <Button variant="outline" className="shrink-0">
              <UserMinus aria-hidden="true" />
              Remove
              <span className="sr-only"> {manager.name}</span>
            </Button>
          }
        />
      </Can>
    </li>
  );
}

export function PropertyManagers({ propertyId }: { propertyId: string }) {
  const query = usePropertyManagers(propertyId);
  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <Can permission="managers.assign">
        <AssignManagerForm propertyId={propertyId} />
      </Can>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Assigned managers</CardTitle>
          <CardDescription>People who can edit this property and run its day-to-day work.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : query.isPending ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No managers assigned"
              description="Assigned managers appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <ManagerItem key={row.managerId} row={row} propertyId={propertyId} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
