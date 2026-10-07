import { CheckCircle2, ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type PhotoState =
  | { status: "none" }
  | { status: "uploading"; progress: number }
  | { status: "failed"; message: string }
  | { status: "done" };

interface PhotoStepProps {
  state: PhotoState;
  onRetry: () => void;
}

/** Shows what happened to the photo after the request was saved. Only the photo is ever retried. */
export function PhotoStep({ state, onRetry }: PhotoStepProps) {
  if (state.status === "uploading") {
    return (
      <div className="space-y-1">
        <Progress value={state.progress} aria-label="Photo upload progress" />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Uploading your photo, {state.progress}%
        </p>
      </div>
    );
  }
  if (state.status === "failed") {
    return (
      <div role="alert" className="space-y-3 rounded-lg border bg-card p-3 text-sm">
        <p className="text-foreground">
          Your request was saved, but the photo did not upload. {state.message}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <ImageUp aria-hidden="true" />
          Try the photo again
        </Button>
      </div>
    );
  }
  if (state.status === "done") {
    return (
      <p className="flex items-center gap-2 text-sm text-foreground" role="status">
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        Your photo was added.
      </p>
    );
  }
  return null;
}
