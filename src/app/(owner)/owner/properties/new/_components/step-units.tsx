"use client";

import { useState } from "react";
import { DoorOpen, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePropertyWizardStore, type WizardUnit } from "@/store/property-wizard-store";
import type { UnitValues } from "@/validation/property";
import { UnitForm } from "../../_components/unit-form";

function toValues(unit: WizardUnit): UnitValues {
  return { label: unit.label, description: unit.description, floor: unit.floor };
}

/** Step 2 (optional). Units are kept in the draft and created after the photos are uploaded. */
export function StepUnits() {
  const units = usePropertyWizardStore((state) => state.units);
  const addUnit = usePropertyWizardStore((state) => state.addUnit);
  const updateUnit = usePropertyWizardStore((state) => state.updateUnit);
  const removeUnit = usePropertyWizardStore((state) => state.removeUnit);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const editing = units.find((unit) => unit.key === editingKey);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add the flats or apartments inside this property. You can skip this step and add units
        later from the property page.
      </p>

      {units.length > 0 ? (
        <ul className="divide-y rounded-xl border bg-card">
          {units.map((unit) => (
            <li
              key={unit.key}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-semibold text-foreground">{unit.label}</p>
                  {unit.floor.trim() ? <Badge variant="neutral">Floor {unit.floor.trim()}</Badge> : null}
                  {unit.createdId ? <Badge variant="success">Created</Badge> : null}
                </div>
                {unit.description.trim() ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{unit.description}</p>
                ) : null}
              </div>
              {unit.createdId ? null : (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingKey(unit.key)}
                    aria-label={`Edit ${unit.label}`}
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-error-text"
                    onClick={() => {
                      if (editingKey === unit.key) setEditingKey(null);
                      removeUnit(unit.key);
                    }}
                    aria-label={`Remove ${unit.label}`}
                  >
                    <Trash2 aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
          <DoorOpen className="size-5 shrink-0" aria-hidden="true" />
          No units added yet.
        </div>
      )}

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <h3 className="text-base font-semibold text-foreground">
          {editing ? `Edit ${editing.label}` : "Add a unit"}
        </h3>
        {editing ? (
          <UnitForm
            key={editing.key}
            mode="create"
            idPrefix="wizard-unit-edit"
            initial={toValues(editing)}
            submitLabel="Save unit"
            pendingLabel="Saving"
            onSubmit={(values) => {
              updateUnit(editing.key, values);
              setEditingKey(null);
            }}
            onCancel={() => setEditingKey(null)}
          />
        ) : (
          <UnitForm
            mode="create"
            idPrefix="wizard-unit-add"
            submitLabel="Add unit"
            pendingLabel="Adding"
            onSubmit={(values) => addUnit(values)}
          />
        )}
      </div>
    </div>
  );
}
