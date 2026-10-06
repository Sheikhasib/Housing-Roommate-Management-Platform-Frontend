"use client";

import { useState } from "react";
import { DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PropertyDetail, PropertyUnit } from "@/types/property";
import { CreateUnitZodSchema, type UnitValues } from "@/validation/property";
import { UnitForm } from "../../_components/unit-form";
import {
  errorMessage,
  useCreateUnit,
  useDeleteUnit,
  useUpdateUnit,
} from "../../_hooks/use-property-queries";

function toValues(unit: PropertyUnit): UnitValues {
  return {
    label: unit.label,
    description: unit.description ?? "",
    floor: unit.floor === null ? "" : String(unit.floor),
  };
}

type DialogState = { kind: "create" } | { kind: "edit"; unit: PropertyUnit } | null;

export function PropertyUnits({ property }: { property: PropertyDetail }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const createMutation = useCreateUnit(property.id);
  const updateMutation = useUpdateUnit(property.id);
  const deleteMutation = useDeleteUnit(property.id);
  const units = property.units;

  const close = () => setDialog(null);

  const handleCreate = async (_values: UnitValues, payload: Record<string, unknown>) => {
    const response = await createMutation.mutateAsync(CreateUnitZodSchema.parse(payload));
    toast.success(response.message);
    close();
  };

  const handleUpdate = async (unit: PropertyUnit, payload: Record<string, unknown>) => {
    // Nothing changed (for example only the floor was cleared, which the backend cannot do).
    if (Object.keys(payload).length === 0) {
      close();
      return;
    }
    const response = await updateMutation.mutateAsync({ unitId: unit.id, body: payload });
    toast.success(response.message);
    close();
  };

  const confirmDelete = async (unit: PropertyUnit) => {
    try {
      const response = await deleteMutation.mutateAsync(unit.id);
      toast.success(response.message);
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  const addButton = (
    <Button type="button" onClick={() => setDialog({ kind: "create" })}>
      <Plus aria-hidden="true" />
      Add unit
    </Button>
  );

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-lg font-semibold">Units</CardTitle>
          <CardDescription>
            Flats or apartments inside this property. Rooms can be placed under a unit.
          </CardDescription>
        </div>
        {units.length > 0 ? addButton : null}
      </CardHeader>
      <CardContent>
        {units.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No units yet"
            description="Add a unit if this property has separate flats. Units are optional."
            action={addButton}
          />
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {units.map((unit) => (
              <li
                key={unit.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-semibold text-foreground">{unit.label}</p>
                    {unit.floor !== null ? <Badge variant="neutral">Floor {unit.floor}</Badge> : null}
                  </div>
                  {unit.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{unit.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialog({ kind: "edit", unit })}
                    aria-label={`Edit ${unit.label}`}
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </Button>
                  <ConfirmDialog
                    destructive
                    title={`Delete ${unit.label}?`}
                    description={`Only the unit ${unit.label} is removed from this property. The property, its rooms and its photos are not changed or deleted.`}
                    confirmLabel="Delete unit"
                    onConfirm={() => confirmDelete(unit)}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="text-error-text"
                        aria-label={`Delete ${unit.label}`}
                      >
                        <Trash2 aria-hidden="true" />
                        Delete
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(open) => (open ? undefined : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.kind === "edit" ? `Edit ${dialog.unit.label}` : "Add a unit"}</DialogTitle>
            <DialogDescription>
              {dialog?.kind === "edit"
                ? "Only the fields you change are saved."
                : "Give the unit a label. Floor and description are optional."}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === "create" ? (
            <UnitForm
              mode="create"
              idPrefix="unit-add"
              submitLabel="Add unit"
              pendingLabel="Adding"
              onSubmit={handleCreate}
              onCancel={close}
            />
          ) : null}
          {dialog?.kind === "edit" ? (
            <UnitForm
              key={dialog.unit.id}
              mode="edit"
              idPrefix="unit-edit"
              initial={toValues(dialog.unit)}
              submitLabel="Save changes"
              pendingLabel="Saving"
              onSubmit={(_values, payload) => handleUpdate(dialog.unit, payload)}
              onCancel={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
