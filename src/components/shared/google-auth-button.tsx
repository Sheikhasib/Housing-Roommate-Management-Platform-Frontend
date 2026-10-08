"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { googleAuthAction } from "@/lib/auth/actions";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const MAX_WIDTH = 400;
const MIN_WIDTH = 200; // Google's smallest allowed button width

/** Continue with Google: gets an ID token from Google and signs in through googleAuthAction. */
export function GoogleAuthButton({ redirectTo, note }: { redirectTo?: string | null; note?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = Math.floor(entry.contentRect.width);
      if (measured > 0) setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, measured)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // resolvedTheme is undefined until after mount, so this also avoids a hydration mismatch.
  const ready = resolvedTheme !== undefined && width !== null;

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
        ref={containerRef}
        className="relative flex h-11 w-full items-center justify-center overflow-hidden rounded-lg border border-input"
        aria-busy={pending}
      >
        {ready ? (
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <GoogleLogin
              key={`${resolvedTheme}-${width}`}
              theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
              size="large"
              text="continue_with"
              shape="rectangular"
              logo_alignment="center"
              width={String(width)}
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
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
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
