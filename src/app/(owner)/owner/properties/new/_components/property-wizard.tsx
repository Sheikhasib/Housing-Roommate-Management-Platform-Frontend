"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, ShieldAlert } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Stepper } from "@/components/shared/stepper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerProfile } from "@/hooks/useProfile";
import { usePropertyWizardStore, type WizardStep } from "@/store/property-wizard-store";
import { DETAILS_FORM_ID, StepDetails } from "./step-details";
import { StepImages } from "./step-images";
import { StepReview } from "./step-review";
import { StepUnits } from "./step-units";
import { SubmitProgress, usePropertySubmit } from "./submit-progress";

const STEPS = ["Details", "Units", "Photos", "Review"] as const;
const STEP_HELP: Record<WizardStep, string> = {
  1: "Tell tenants what the property is and where it is.",
  2: "Optional. Add the flats or apartments inside the property.",
  3: "Add photos of the property.",
  4: "Check everything, then create the property.",
};

function WizardBody({ restored }: { restored: boolean }) {
  const step = usePropertyWizardStore((state) => state.step);
  const setStep = usePropertyWizardStore((state) => state.setStep);
  const propertyId = usePropertyWizardStore((state) => state.propertyId);
  const imagesUploaded = usePropertyWizardStore((state) => state.imagesUploaded);
  const units = usePropertyWizardStore((state) => state.units);
  const reset = usePropertyWizardStore((state) => state.reset);

  const [files, setFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Bumped on "Discard draft" so the forms and the photo picker start empty again.
  const [draftKey, setDraftKey] = useState(0);

  const owner = useOwnerProfile(true);
  const approved = owner.data?.verificationStatus === "APPROVED";
  const submit = usePropertySubmit(files);

  // After the property exists its details cannot change here: only units and photos remain.
  const minStep: WizardStep = propertyId ? 2 : 1;
  const needsPhotos = !imagesUploaded && files.length === 0;
  const createdUnitCount = units.filter((unit) => unit.createdId).length;
  const retrying = submit.error !== null;

  if (submit.finished) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8" role="status">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">Property created. Opening it now.</p>
        </CardContent>
      </Card>
    );
  }

  const goBack = () => {
    setPhotoError(null);
    if (step > minStep) setStep((step - 1) as WizardStep);
  };

  const goNext = () => {
    if (step === 3) {
      if (needsPhotos) {
        setPhotoError("Add at least one photo to continue.");
        return;
      }
      setPhotoError(null);
    }
    setStep((step + 1) as WizardStep);
  };

  const discard = () => {
    reset();
    setFiles([]);
    setPhotoError(null);
    setDraftKey((key) => key + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create property"
        description="Four short steps. Your draft is kept if you refresh this page."
        action={
          propertyId ? null : (
            <ConfirmDialog
              destructive
              title="Discard this draft?"
              description="Everything you entered here is cleared. Nothing has been created yet."
              confirmLabel="Discard draft"
              onConfirm={discard}
              trigger={
                <Button type="button" variant="outline" disabled={submit.running}>
                  Discard draft
                </Button>
              }
            />
          )
        }
      />

      {owner.data && !approved ? (
        <Alert role="status">
          <ShieldAlert aria-hidden="true" />
          <AlertDescription>
            Your owner account is {owner.data.verificationStatus.toLowerCase()}. You can list
            properties only after an admin approves your account.{" "}
            <Link href="/owner/profile" className="font-medium text-primary underline">
              Go to verification
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <Stepper steps={STEPS} current={step} label="Create property steps" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Step {step}: {STEPS[step - 1]}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{STEP_HELP[step]}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? <StepDetails key={draftKey} onValid={() => setStep(2)} /> : null}
          {step === 2 ? <StepUnits /> : null}
          {/* Always mounted so the chosen photos survive Back and Next. */}
          <div hidden={step !== 3}>
            <StepImages
              key={draftKey}
              onFilesChange={(next) => {
                setFiles(next);
                setPhotoError(null);
              }}
              restored={restored}
              hasFiles={files.length > 0}
              error={photoError}
            />
          </div>
          {step === 4 ? (
            <>
              <StepReview files={files} />
              <SubmitProgress
                state={submit}
                propertyId={propertyId}
                unitCount={units.length}
                createdUnitCount={createdUnitCount}
                photoCount={files.length}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-background py-3 sm:static sm:border-0 sm:py-0">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step <= minStep || submit.running}
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>

        {step === 1 ? (
          <Button type="submit" form={DETAILS_FORM_ID}>
            Next
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : step < 4 ? (
          <Button type="button" onClick={goNext}>
            Next
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : submit.error && !submit.error.retryable ? null : (
          <Button
            type="button"
            onClick={() => void submit.run()}
            disabled={!approved || submit.running || needsPhotos}
          >
            {submit.running ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {submit.running ? "Creating" : retrying ? "Retry from here" : "Create property"}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The create wizard. The draft store is rehydrated by hand after mount (it lives in
 * sessionStorage), so the first render matches the server and the forms start from the draft.
 */
export function PropertyWizard() {
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve(usePropertyWizardStore.persist.rehydrate()).then(() => {
      if (!active) return;
      const { step, imagesUploaded, setStep } = usePropertyWizardStore.getState();
      // Photos are never saved, so a restored draft past the photo step goes back to it.
      if (step >= 3 && !imagesUploaded) {
        setStep(3);
        setRestored(true);
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <WizardBody restored={restored} />;
}
