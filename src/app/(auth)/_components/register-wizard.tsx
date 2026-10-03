"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Briefcase, Building2, Check, Info, Loader2, UserRound, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { FormError, FormField, SubmitButton, firstError } from "@/components/shared/form-field";
import { GoogleAuthButton } from "@/components/shared/google-auth-button";
import { PasswordChecklist, PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { registerAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import {
  compactProfile,
  registerAccountSchema,
  registerZodSchema,
  zodFieldErrors,
  type RegisterRole,
} from "@/validation/auth";
import { GENDERS } from "@/validation/enums";

const ACCOUNT_FIELDS = ["name", "email", "password", "role"] as const;
const PROFILE_FIELDS = [
  "contactNumber",
  "gender",
  "occupation",
  "preferredCity",
  "monthlyBudgetMax",
  "smoker",
  "petFriendly",
  "lookingForRoommate",
  "companyName",
  "address",
  "bio",
] as const;
const KNOWN_FIELDS = [...ACCOUNT_FIELDS, ...PROFILE_FIELDS, ...PROFILE_FIELDS.map((f) => `profile.${f}`)];

const ROLE_CARDS: { role: RegisterRole; title: string; text: string; icon: LucideIcon }[] = [
  { role: "TENANT", title: "Tenant", text: "Find a room or a roommate and pay rent online.", icon: UserRound },
  { role: "OWNER", title: "Owner", text: "List your properties and rooms and manage tenants.", icon: Building2 },
  {
    role: "PROPERTY_MANAGER",
    title: "Property manager",
    text: "Help an owner run day-to-day property tasks.",
    icon: Briefcase,
  },
];

const GENDER_LABEL: Record<(typeof GENDERS)[number], string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const CHECKED_STYLE =
  "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground";

function Stepper({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, label: "Account" },
    { n: 2, label: "Your profile" },
  ] as const;
  return (
    <ol className="flex items-center gap-3" aria-label="Registration steps">
      {items.map((item, index) => {
        const done = step > item.n;
        const current = step === item.n;
        return (
          <li key={item.n} className="flex flex-1 items-center gap-3 last:flex-none" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                done || current
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : item.n}
            </span>
            <span className={cn("text-sm font-medium", current ? "text-foreground" : "text-muted-foreground")}>
              {item.label}
              {done ? <span className="sr-only"> (done)</span> : null}
            </span>
            {index < items.length - 1 ? <span className="h-px flex-1 bg-border" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function RegisterWizard({ redirectTo }: { redirectTo: string | null }) {
  const router = useRouter();
  const feedback = useActionFeedback();
  const [step, setStep] = useState<1 | 2>(1);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "TENANT" as RegisterRole,
      contactNumber: "",
      gender: "",
      occupation: "",
      preferredCity: "",
      monthlyBudgetMax: "",
      smoker: false,
      petFriendly: false,
      lookingForRoommate: false,
      companyName: "",
      address: "",
      bio: "",
    },
    onSubmit: async ({ value }) => {
      feedback.reset();
      const budget = value.monthlyBudgetMax.trim();
      const profile =
        value.role === "TENANT"
          ? compactProfile({
              contactNumber: value.contactNumber.trim(),
              gender: value.gender || undefined,
              occupation: value.occupation.trim(),
              preferredCity: value.preferredCity.trim(),
              monthlyBudgetMax: budget ? Number(budget) : undefined,
              smoker: value.smoker,
              petFriendly: value.petFriendly,
              lookingForRoommate: value.lookingForRoommate,
            })
          : value.role === "OWNER"
            ? compactProfile({
                contactNumber: value.contactNumber.trim(),
                companyName: value.companyName.trim(),
                address: value.address.trim(),
              })
            : compactProfile({ contactNumber: value.contactNumber.trim(), bio: value.bio.trim() });

      const parsed = registerZodSchema.safeParse({
        name: value.name.trim(),
        email: value.email.trim(),
        password: value.password,
        role: value.role,
        ...(profile ? { profile } : {}),
      });
      if (!parsed.success) {
        const errors = zodFieldErrors(parsed.error);
        setLocalErrors(errors);
        if (ACCOUNT_FIELDS.some((field) => field in errors)) setStep(1);
        return;
      }
      setLocalErrors({});

      const result = await registerAction(parsed.data);
      if (result.ok) {
        setSent(true);
        toast.success("Verification code sent. Check your email");
        const params = new URLSearchParams({ email: parsed.data.email });
        if (redirectTo) params.set("redirectTo", redirectTo);
        router.push(`/verify-email?${params.toString()}`);
        return;
      }
      feedback.handleFailure(result, KNOWN_FIELDS);
      const fields = Object.keys(result.fieldErrors ?? {});
      if (result.status === 409) {
        setLocalErrors({ email: result.message });
        setStep(1);
      } else if (fields.some((field) => (ACCOUNT_FIELDS as readonly string[]).includes(field))) {
        setStep(1);
      }
    },
  });

  function errorFor(name: string, metaErrors: readonly unknown[] | undefined): string | undefined {
    return (
      firstError(metaErrors) ??
      localErrors[name] ??
      feedback.fieldErrors[name] ??
      feedback.fieldErrors[`profile.${name}`]
    );
  }

  function clearErrors(name: string) {
    feedback.clearField(name);
    feedback.clearField(`profile.${name}`);
    setLocalErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function goToStep2() {
    const { name, email, password, role } = form.state.values;
    const parsed = registerAccountSchema.safeParse({ name: name.trim(), email: email.trim(), password, role });
    if (!parsed.success) {
      setLocalErrors(zodFieldErrors(parsed.error));
      return;
    }
    setLocalErrors({});
    feedback.reset();
    setStep(2);
  }

  function textField(name: "name" | "email" | "contactNumber" | "occupation" | "preferredCity" | "companyName" | "address" | "monthlyBudgetMax", label: string, props: { type?: string; autoComplete?: string; placeholder?: string; helper?: string; inputMode?: "numeric" | "tel" }) {
    return (
      <form.Field name={name}>
        {(field) => (
          <FormField
            id={`register-${name}`}
            label={label}
            helper={props.helper}
            error={errorFor(name, field.state.meta.errors)}
          >
            {(control) => (
              <Input
                {...control}
                name={name}
                type={props.type ?? "text"}
                inputMode={props.inputMode}
                autoComplete={props.autoComplete}
                placeholder={props.placeholder}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  clearErrors(name);
                  field.handleChange(event.target.value);
                }}
              />
            )}
          </FormField>
        )}
      </form.Field>
    );
  }

  function checkbox(name: "smoker" | "petFriendly" | "lookingForRoommate", label: string) {
    return (
      <form.Field name={name}>
        {(field) => (
          <div className="flex min-h-10 items-center gap-3">
            <Checkbox
              id={`register-${name}`}
              checked={field.state.value}
              className={CHECKED_STYLE}
              onCheckedChange={(checked) => field.handleChange(checked === true)}
            />
            <Label htmlFor={`register-${name}`} className="font-normal">
              {label}
            </Label>
          </div>
        )}
      </form.Field>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 ? "Start with your account details." : "Tell us a little more. Everything here is optional."}
        </p>
      </div>

      <Stepper step={step} />

      {step === 1 ? (
        <>
          <GoogleAuthButton
            redirectTo={redirectTo}
            note="Signing up with Google creates a Tenant account."
          />
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground" role="separator">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (step === 1) goToStep2();
          else void form.handleSubmit();
        }}
      >
        {step === 1 ? (
          <>
            {textField("name", "Full name", { autoComplete: "name", placeholder: "Your full name" })}
            {textField("email", "Email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}

            <form.Field name="password">
              {(field) => (
                <FormField
                  id="register-password"
                  label="Password"
                  error={errorFor("password", field.state.meta.errors)}
                >
                  {(control) => (
                    <div className="space-y-2">
                      <PasswordInput
                        {...control}
                        name="password"
                        autoComplete="new-password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          clearErrors("password");
                          field.handleChange(event.target.value);
                        }}
                      />
                      <PasswordChecklist id="register-password-rules" value={field.state.value} />
                    </div>
                  )}
                </FormField>
              )}
            </form.Field>

            <form.Field name="role">
              {(field) => (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">I want to join as</legend>
                  <div className="grid gap-3">
                    {ROLE_CARDS.map((card) => {
                      const Icon = card.icon;
                      const id = `register-role-${card.role}`;
                      return (
                        <div key={card.role}>
                          <input
                            id={id}
                            type="radio"
                            name="role"
                            value={card.role}
                            checked={field.state.value === card.role}
                            onChange={() => field.handleChange(card.role)}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={id}
                            className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors duration-150 hover:bg-accent peer-checked:border-primary peer-checked:bg-accent peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-foreground">{card.title}</span>
                              <span className="block text-xs font-normal text-muted-foreground">{card.text}</span>
                            </span>
                            {field.state.value === card.role ? (
                              <>
                                <Check className="size-4 shrink-0 text-primary" aria-hidden />
                                <span className="sr-only">Selected</span>
                              </>
                            ) : null}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <form.Subscribe selector={(state) => state.values.role}>
                    {(role) =>
                      role === "OWNER" ? (
                        <p className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                          An admin must approve your owner account before you can list properties.
                        </p>
                      ) : null
                    }
                  </form.Subscribe>
                  {errorFor("role", field.state.meta.errors) ? (
                    <p role="alert" className="text-xs text-error-text">
                      {errorFor("role", field.state.meta.errors)}
                    </p>
                  ) : null}
                </fieldset>
              )}
            </form.Field>

            <Button type="submit" className="h-10 w-full">
              Continue
            </Button>
          </>
        ) : (
          <>
            <form.Subscribe selector={(state) => state.values.role}>
              {(role) => (
                <div className="space-y-4">
                  {textField("contactNumber", "Contact number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}

                  {role === "TENANT" ? (
                    <>
                      <form.Field name="gender">
                        {(field) => (
                          <FormField id="register-gender" label="Gender" error={errorFor("gender", field.state.meta.errors)}>
                            {(control) => (
                              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)}>
                                <SelectTrigger {...control} className="h-10 w-full">
                                  <SelectValue placeholder="Prefer not to say" />
                                </SelectTrigger>
                                <SelectContent>
                                  {GENDERS.map((gender) => (
                                    <SelectItem key={gender} value={gender}>
                                      {GENDER_LABEL[gender]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </FormField>
                        )}
                      </form.Field>
                      {textField("occupation", "Occupation", { placeholder: "Student, engineer, designer" })}
                      {textField("preferredCity", "Preferred city", { placeholder: "Where do you want to live?" })}
                      {textField("monthlyBudgetMax", "Maximum monthly budget", {
                        inputMode: "numeric",
                        helper: "Whole number in BDT. Leave empty if you are not sure.",
                      })}
                      <div className="space-y-1">
                        {checkbox("smoker", "I smoke")}
                        {checkbox("petFriendly", "I am comfortable living with pets")}
                        {checkbox("lookingForRoommate", "I am looking for a roommate")}
                      </div>
                    </>
                  ) : null}

                  {role === "OWNER" ? (
                    <>
                      {textField("companyName", "Company name", { autoComplete: "organization" })}
                      {textField("address", "Address", { autoComplete: "street-address" })}
                    </>
                  ) : null}

                  {role === "PROPERTY_MANAGER" ? (
                    <form.Field name="bio">
                      {(field) => (
                        <FormField id="register-bio" label="About you" error={errorFor("bio", field.state.meta.errors)}>
                          {(control) => (
                            <Textarea
                              {...control}
                              name="bio"
                              rows={4}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                clearErrors("bio");
                                field.handleChange(event.target.value);
                              }}
                            />
                          )}
                        </FormField>
                      )}
                    </form.Field>
                  ) : null}
                </div>
              )}
            </form.Subscribe>

            <FormError message={feedback.formError} />

            {sent ? (
              <p role="status" className="flex items-center gap-2 text-sm text-success">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Code sent. Taking you to verification
              </p>
            ) : null}

            <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-border bg-background px-4 py-3 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  feedback.reset();
                  setStep(1);
                }}
              >
                Back
              </Button>
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <SubmitButton
                    className="sm:w-auto"
                    pending={isSubmitting}
                    disabled={sent}
                    cooldownSeconds={feedback.cooldownSeconds}
                    label="Create account"
                    pendingLabel="Sending code"
                  />
                )}
              </form.Subscribe>
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}
          className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
