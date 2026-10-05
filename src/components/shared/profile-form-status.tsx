import { CheckCircle2 } from "lucide-react";

import { FormError } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileFormStatusProps {
  /** Backend success message, shown as is. */
  savedMessage: string | null;
  errorMessage: string | null;
}

/** Inline success and server-error messages shared by the profile forms. */
export function ProfileFormStatus({ savedMessage, errorMessage }: ProfileFormStatusProps) {
  return (
    <>
      {savedMessage ? (
        <Alert role="status">
          <CheckCircle2 className="text-success" aria-hidden />
          <AlertDescription>{savedMessage}</AlertDescription>
        </Alert>
      ) : null}
      <FormError message={errorMessage} />
    </>
  );
}
