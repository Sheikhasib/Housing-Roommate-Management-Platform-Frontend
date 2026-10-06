"use client";

import { useForm } from "@tanstack/react-form";

import { FormField, FormError, SubmitButton, firstError } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { toFormFailure } from "@/lib/api/formFailure";
import {
  CreateUnitZodSchema,
  EMPTY_UNIT_VALUES,
  UNIT_FIELDS,
  UpdateUnitZodSchema,
  toFieldErrors,
  toUnitCreatePayload,
  toUnitUpdatePayload,
  type UnitValues,
} from "@/validation/property";

interface UnitFormProps {
  /** `create` sends every filled field; `edit` sends only what changed (strict update schema). */
  mode: "create" | "edit";
  initial?: UnitValues;
  /** Prefix that keeps input ids unique when two forms are on one page. */
  idPrefix: string;
  submitLabel: string;
  pendingLabel: string;
  /** May throw an ApiError: it is shown on the form and as a toast, and the form stays open. */
  onSubmit: (values: UnitValues, payload: Record<string, unknown>) => void | Promise<void>;
  onCancel?: () => void;
}

/** One unit form, used by the create wizard (draft) and by the Units tab (live). */
export function UnitForm({
  mode,
  initial = EMPTY_UNIT_VALUES,
  idPrefix,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
}: UnitFormProps) {
  const feedback = useActionFeedback();
  const edit = mode === "edit";

  const toPayload = (value: UnitValues) =>
    edit ? toUnitUpdatePayload(value, initial) : toUnitCreatePayload(value);
  const schema = edit ? UpdateUnitZodSchema : CreateUnitZodSchema;

  const form = useForm({
    defaultValues: initial,
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(toPayload(value));
        return result.success ? undefined : toFieldErrors(result.error);
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      try {
        await onSubmit(value, schema.parse(toPayload(value)));
        form.reset(edit ? value : EMPTY_UNIT_VALUES);
      } catch (error) {
        feedback.handleFailure(toFormFailure(error), UNIT_FIELDS);
      }
    },
  });

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
      <FormError message={feedback.formError} />

      <form.Field name="label">
        {(field) => (
          <FormField
            id={`${idPrefix}-label`}
            label="Unit label"
            required
            helper="For example Flat 4B. Up to 50 characters."
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.label}
          >
            {(control) => (
              <Input
                {...control}
                name="label"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("label");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="floor">
        {(field) => (
          <FormField
            id={`${idPrefix}-floor`}
            label="Floor"
            helper={
              edit
                ? "A whole number from -2 to 200. If you clear it, the current floor stays unchanged."
                : "Optional. A whole number from -2 to 200."
            }
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.floor}
          >
            {(control) => (
              <Input
                {...control}
                name="floor"
                inputMode="numeric"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("floor");
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
            id={`${idPrefix}-description`}
            label="Description"
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.description}
          >
            {(control) => (
              <Textarea
                {...control}
                name="description"
                rows={2}
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

      <form.Subscribe selector={(state) => [state.isSubmitting, state.isDefaultValue] as const}>
        {([isSubmitting, isDefaultValue]) => (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            ) : null}
            <SubmitButton
              pending={isSubmitting}
              disabled={edit && isDefaultValue}
              cooldownSeconds={feedback.cooldownSeconds}
              label={submitLabel}
              pendingLabel={pendingLabel}
              className="sm:w-auto sm:min-w-36"
            />
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
