"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { useGetMe } from "@/hooks/useGetMe";
import { ApiError } from "@/lib/api/apiError";
import { sendContactMessage } from "@/lib/api/contact";
import { CONTACT_MESSAGE_MAX, ContactMessageZodSchema } from "@/validation/contact";

const FIELDS = ["name", "email", "subject", "message"] as const;
type FieldName = (typeof FIELDS)[number];
type ContactValues = Record<FieldName, string>;

const EMPTY: ContactValues = { name: "", email: "", subject: "", message: "" };

/** The schema marks subject optional, so a blank input is sent as "no subject". */
function toPayload(value: ContactValues) {
  return { ...value, subject: value.subject.trim() || undefined };
}

export function ContactForm() {
  const feedback = useActionFeedback();
  const me = useGetMe();
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: EMPTY,
    validators: {
      onSubmit: ({ value }) => {
        const result = ContactMessageZodSchema.safeParse(toPayload(value));
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = String(issue.path[0]);
          if (!(key in fields)) fields[key] = issue.message;
        }
        return { fields };
      },
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      setSent(false);
      try {
        await sendContactMessage(ContactMessageZodSchema.parse(toPayload(value)));
      } catch (error) {
        const fieldErrors: Record<string, string> = {};
        if (error instanceof ApiError) {
          for (const item of error.errors) {
            if (item.field && !(item.field in fieldErrors)) fieldErrors[item.field] = item.message;
          }
        }
        feedback.handleFailure(
          error instanceof ApiError
            ? {
                ok: false,
                status: error.status,
                message: error.errors[0]?.message || error.message,
                fieldErrors,
              }
            : { ok: false, message: "Something went wrong. Try again" },
          FIELDS,
        );
        return;
      }
      toast.success("Thanks, we received your message");
      setSent(true);
      form.reset({ ...EMPTY, name: me.data?.name ?? "", email: me.data?.email ?? "" });
    },
  });

  const meName = me.data?.name;
  const meEmail = me.data?.email;
  useEffect(() => {
    if (meName && !form.getFieldValue("name")) form.setFieldValue("name", meName);
    if (meEmail && !form.getFieldValue("email")) form.setFieldValue("email", meEmail);
  }, [form, meName, meEmail]);

  const hasFieldErrors = Object.keys(feedback.fieldErrors).length > 0;
  const showFormError = Boolean(feedback.formError) && (!hasFieldErrors || feedback.coolingDown);

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
      {sent ? (
        <Alert role="status">
          <CheckCircle2 className="text-success" aria-hidden />
          <AlertTitle>Thanks, we received your message</AlertTitle>
          <AlertDescription>We will reply to the email address you gave us.</AlertDescription>
        </Alert>
      ) : null}

      {showFormError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>We could not send your message</AlertTitle>
          <AlertDescription>{feedback.formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="name">
          {(field) => (
            <FormField
              id="contact-name"
              label="Name"
              required
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.name}
            >
              {(control) => (
                <Input
                  {...control}
                  name="name"
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    feedback.clearField("name");
                    field.handleChange(event.target.value);
                  }}
                />
              )}
            </FormField>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <FormField
              id="contact-email"
              label="Email"
              required
              error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.email}
            >
              {(control) => (
                <Input
                  {...control}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    feedback.clearField("email");
                    field.handleChange(event.target.value);
                  }}
                />
              )}
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="subject">
        {(field) => (
          <FormField
            id="contact-subject"
            label="Subject (optional)"
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.subject}
          >
            {(control) => (
              <Input
                {...control}
                name="subject"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("subject");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Field name="message">
        {(field) => (
          <FormField
            id="contact-message"
            label="Message"
            required
            helper={`${field.state.value.length} / ${CONTACT_MESSAGE_MAX} characters`}
            error={firstError(field.state.meta.errors) ?? feedback.fieldErrors.message}
          >
            {(control) => (
              <Textarea
                {...control}
                name="message"
                rows={6}
                className="min-h-32"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  feedback.clearField("message");
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <SubmitButton
            pending={isSubmitting}
            cooldownSeconds={feedback.cooldownSeconds}
            label="Send message"
            pendingLabel="Sending message"
            className="sm:w-auto sm:min-w-40"
          />
        )}
      </form.Subscribe>
    </form>
  );
}
