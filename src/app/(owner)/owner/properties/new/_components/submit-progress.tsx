"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { createProperty, createUnit, uploadPropertyImages } from "@/lib/api/ownerProperty";
import { usePropertyWizardStore } from "@/store/property-wizard-store";
import {
  CreatePropertyZodSchema,
  CreateUnitZodSchema,
  toCreatePropertyPayload,
  toUnitCreatePayload,
} from "@/validation/property";
import { errorMessage, propertiesKey } from "../../_hooks/use-property-queries";

export type Phase = "property" | "images" | "units";
export type PhaseStatus = "idle" | "running" | "done" | "failed";

interface SubmitError {
  phase: Phase;
  /** The backend message, unchanged. */
  message: string;
  /** The unit the failure belongs to, when the units step failed. */
  unitLabel?: string;
  /** False when a retry could create a duplicate. */
  retryable: boolean;
}

function initialStatus(): Record<Phase, PhaseStatus> {
  const { propertyId, imagesUploaded, units } = usePropertyWizardStore.getState();
  return {
    property: propertyId ? "done" : "idle",
    images: imagesUploaded ? "done" : "idle",
    units: units.every((unit) => unit.createdId) ? "done" : "idle",
  };
}

/**
 * Runs create property, then upload images, then create units. Every success is written to the
 * store at once, so "Retry from here" resumes at the failed step and never repeats finished work.
 */
export function usePropertySubmit(files: readonly File[]) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Record<Phase, PhaseStatus>>(initialStatus);
  const [error, setError] = useState<SubmitError | null>(null);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  });

  const run = useCallback(async () => {
    const store = usePropertyWizardStore.getState;
    const setPhase = (phase: Phase, value: PhaseStatus) =>
      setStatus((current) => ({ ...current, [phase]: value }));
    const fail = (phase: Phase, message: string, extra: Partial<SubmitError> = {}) => {
      setPhase(phase, "failed");
      setError({ phase, message, retryable: true, ...extra });
    };

    setRunning(true);
    setError(null);
    let createdMessage = "Property created successfully";

    try {
      // 1. The property, created only once: its id is stored right away.
      let propertyId = store().propertyId;
      if (propertyId) {
        setPhase("property", "done");
      } else {
        setPhase("property", "running");
        const parsed = CreatePropertyZodSchema.safeParse(toCreatePropertyPayload(store().details));
        if (!parsed.success) {
          fail("property", parsed.error.issues[0]?.message ?? "Check the property details");
          return;
        }
        try {
          const response = await createProperty(parsed.data);
          if (typeof response.data?.id !== "string") {
            fail(
              "property",
              "The property was created, but the server did not return its id. Open your properties list to find it.",
              { retryable: false },
            );
            return;
          }
          createdMessage = response.message;
          propertyId = response.data.id;
          store().setPropertyId(propertyId);
          setPhase("property", "done");
        } catch (caught) {
          fail("property", errorMessage(caught));
          return;
        }
      }

      // 2. The photos, in one request.
      if (store().imagesUploaded) {
        setPhase("images", "done");
      } else {
        if (filesRef.current.length === 0) {
          fail("images", "Choose at least one photo again: photos are not saved with the draft.");
          return;
        }
        setPhase("images", "running");
        setImageProgress(0);
        try {
          await uploadPropertyImages(propertyId, filesRef.current, setImageProgress);
          store().markImagesUploaded();
          setPhase("images", "done");
        } catch (caught) {
          fail("images", errorMessage(caught));
          return;
        } finally {
          setImageProgress(null);
        }
      }

      // 3. The units that are not created yet.
      const pending = store().units.filter((unit) => !unit.createdId);
      if (pending.length > 0) setPhase("units", "running");
      for (const unit of pending) {
        const parsed = CreateUnitZodSchema.safeParse(toUnitCreatePayload(unit));
        if (!parsed.success) {
          fail("units", parsed.error.issues[0]?.message ?? "Check this unit", {
            unitLabel: unit.label,
          });
          return;
        }
        try {
          const response = await createUnit(propertyId, parsed.data);
          if (typeof response.data?.id !== "string") {
            fail(
              "units",
              "The unit was created, but the server did not return its id. Check the Units tab before retrying.",
              { unitLabel: unit.label, retryable: false },
            );
            return;
          }
          store().markUnitCreated(unit.key, response.data.id);
        } catch (caught) {
          fail("units", errorMessage(caught), { unitLabel: unit.label });
          return;
        }
      }
      setPhase("units", "done");

      store().reset();
      void queryClient.invalidateQueries({ queryKey: propertiesKey() });
      toast.success(createdMessage);
      setFinished(true);
      router.replace(`/owner/properties/${encodeURIComponent(propertyId)}`);
    } finally {
      setRunning(false);
    }
  }, [queryClient, router]);

  return { status, error, imageProgress, running, finished, run };
}

function StatusIcon({ status }: { status: PhaseStatus }) {
  if (status === "running") {
    return <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />;
  }
  if (status === "done") return <CheckCircle2 className="size-5 text-success" aria-hidden="true" />;
  if (status === "failed") return <XCircle className="size-5 text-error-text" aria-hidden="true" />;
  return <Circle className="size-5 text-muted-foreground" aria-hidden="true" />;
}

const STATUS_TEXT: Record<PhaseStatus, string> = {
  idle: "Waiting",
  running: "In progress",
  done: "Done",
  failed: "Failed",
};

interface SubmitProgressProps {
  state: ReturnType<typeof usePropertySubmit>;
  propertyId: string | undefined;
  unitCount: number;
  createdUnitCount: number;
  photoCount: number;
}

/** The per-step checklist. A failed step shows the backend message and a link to finish later. */
export function SubmitProgress({
  state,
  propertyId,
  unitCount,
  createdUnitCount,
  photoCount,
}: SubmitProgressProps) {
  const { status, error, imageProgress } = state;
  const rows: { phase: Phase; label: string; detail: string }[] = [
    { phase: "property", label: "Create the property", detail: "Saves the details" },
    {
      phase: "images",
      label: "Upload photos",
      detail: `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`,
    },
    {
      phase: "units",
      label: "Create units",
      detail: unitCount === 0 ? "No units to create" : `${createdUnitCount} of ${unitCount} created`,
    },
  ];

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm" aria-live="polite">
      <h3 className="text-base font-semibold text-foreground">Progress</h3>
      <ol className="space-y-3">
        {rows.map((row) => (
          <li key={row.phase} className="space-y-2">
            <div className="flex items-start gap-3">
              <StatusIcon status={status[row.phase]} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {row.label}
                  <span className="sr-only">: {STATUS_TEXT[status[row.phase]]}</span>
                </p>
                <p className="text-xs text-muted-foreground">{row.detail}</p>
              </div>
            </div>
            {row.phase === "images" && imageProgress !== null ? (
              <div className="space-y-1 pl-8">
                <Progress value={imageProgress} aria-label="Photo upload progress" />
                <p className="text-xs text-muted-foreground">Uploading {imageProgress}%</p>
              </div>
            ) : null}
            {error?.phase === row.phase ? (
              <p role="alert" className="pl-8 text-sm text-error-text">
                {error.unitLabel ? <span className="font-medium">{error.unitLabel}: </span> : null}
                {error.message}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      {error ? (
        <p className="text-sm text-muted-foreground">
          {error.retryable
            ? "Finished steps are kept. Retry continues from the step that failed."
            : "Do not retry: it could create a duplicate."}
          {propertyId ? (
            <>
              {" "}
              <Link
                href={`/owner/properties/${encodeURIComponent(propertyId)}`}
                className="font-medium text-primary underline"
              >
                Open the property to finish later
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
