"use client";

import { useState, useTransition } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { googleAuthAction } from "@/lib/auth/actions";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Continue with Google: gets an ID token from Google and signs in through googleAuthAction. */
export function GoogleAuthButton({ redirectTo, note }: { redirectTo?: string | null; note?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!CLIENT_ID) {
    return (
      <div className="space-y-1.5">
        <Button type="button" variant="outline" className="h-10 w-full" disabled>
          Continue with Google
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Google sign-in is not set up for this site yet.
        </p>
      </div>
    );
  }

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  return (
    <div className="space-y-2">
      <div
        className="relative flex min-h-10 justify-center"
        aria-busy={pending}
      >
        <GoogleOAuthProvider clientId={CLIENT_ID}>
          <GoogleLogin
            text="continue_with"
            shape="rectangular"
            width="360"
            onSuccess={(response) => {
              if (!response.credential) {
                fail("Google did not return a sign-in token. Try again");
                return;
              }
              const idToken = response.credential;
              setError(null);
              startTransition(async () => {
                const result = await googleAuthAction(idToken, redirectTo);
                if (result && !result.ok) fail(result.message);
              });
            }}
            onError={() => fail("Google sign-in did not complete. Try again")}
          />
        </GoogleOAuthProvider>
        {pending ? (
          <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-card text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Signing you in
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-center text-xs text-error-text">
          {error}
        </p>
      ) : null}
      {note ? <p className="text-center text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
