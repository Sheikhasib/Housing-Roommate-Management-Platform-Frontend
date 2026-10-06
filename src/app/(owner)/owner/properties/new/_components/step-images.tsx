"use client";

import { CheckCircle2, Info } from "lucide-react";

import { FileUploader } from "@/components/shared/file-uploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePropertyWizardStore } from "@/store/property-wizard-store";

const MAX_IMAGES = 10;

interface StepImagesProps {
  onFilesChange: (files: File[]) => void;
  /** The draft was restored after a refresh, so the photos must be chosen again. */
  restored: boolean;
  hasFiles: boolean;
  error: string | null;
}

/**
 * Step 3. Photos are only collected here: they are uploaded when the property is created.
 * The files live in memory only, never in the saved draft.
 */
export function StepImages({ onFilesChange, restored, hasFiles, error }: StepImagesProps) {
  const imagesUploaded = usePropertyWizardStore((state) => state.imagesUploaded);

  if (imagesUploaded) {
    return (
      <Alert role="status">
        <CheckCircle2 className="text-success" aria-hidden="true" />
        <AlertDescription>
          The photos are already uploaded. Continue to finish the remaining steps.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add up to {MAX_IMAGES} photos. The first photo is the cover shown on cards.
      </p>
      {restored && !hasFiles ? (
        <Alert role="status">
          <Info aria-hidden="true" />
          <AlertDescription>
            Your draft was restored, but photos are not saved with it. Choose the photos again.
          </AlertDescription>
        </Alert>
      ) : null}
      <FileUploader
        kind="image"
        fieldName="images"
        maxFiles={MAX_IMAGES}
        label="Choose property photos"
        onFilesChange={onFilesChange}
      />
      {error ? (
        <p role="alert" className="text-sm text-error-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
