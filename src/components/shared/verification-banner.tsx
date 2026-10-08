"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ShieldAlert, X, XCircle, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useOwnerProfile, useTenantProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/validation/enums";

type Tone = "info" | "warning" | "error";

const TONE_CLASSES: Record<Tone, string> = {
  info: "border-info/30 bg-info-bg text-info",
  warning: "border-warning/30 bg-warning-bg text-warning",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
};

const DISMISS_KEY = "verification-banner-dismissed";

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function storeDismissed() {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Dismissing still hides the banner for this page view.
  }
}

interface BannerViewProps {
  status: VerificationStatus;
  submitted: boolean;
  rejectionReason: string | null;
  profileHref: string;
  promptText: string;
}

function BannerView({ status, submitted, rejectionReason, profileHref, promptText }: BannerViewProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (status === "APPROVED") return null;

  const rejected = status === "REJECTED";
  const reviewing = status === "PENDING" && submitted;
  if (reviewing && dismissed) return null;

  let tone: Tone;
  let Icon: LucideIcon;
  let title: string;
  let linkLabel: string;
  if (rejected) {
    tone = "error";
    Icon = XCircle;
    title = "Your verification was not approved";
    linkLabel = "Submit again";
  } else if (reviewing) {
    tone = "info";
    Icon = Clock;
    title = "Your verification is being reviewed";
    linkLabel = "View status";
  } else {
    tone = "warning";
    Icon = ShieldAlert;
    title = promptText;
    linkLabel = "Verify now";
  }

  return (
    <div
      role={rejected ? "alert" : "status"}
      className={cn(
        "mx-auto mb-6 flex max-w-7xl flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center",
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold">{title}</p>
        {rejected && rejectionReason ? (
          <p className="wrap-break-word text-sm text-foreground">Reason from the reviewer: {rejectionReason}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" variant="outline" className="h-10 bg-background text-foreground">
          <Link href={profileHref}>{linkLabel}</Link>
        </Button>
        {reviewing ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-10"
            aria-label="Dismiss for this session"
            onClick={() => {
              storeDismissed();
              setDismissed(true);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TenantBanner() {
  const { data } = useTenantProfile(true);
  if (!data) return null;
  return (
    <BannerView
      status={data.verificationStatus}
      submitted={Boolean(data.verificationDocUrl)}
      rejectionReason={data.rejectionReason}
      profileHref="/dashboard/profile?tab=verification"
      promptText="Verify your identity to pay deposits and invoices"
    />
  );
}

function OwnerBanner() {
  const { data } = useOwnerProfile(true);
  if (!data) return null;
  return (
    <BannerView
      status={data.verificationStatus}
      submitted={(data.documents?.length ?? 0) > 0}
      rejectionReason={data.rejectionReason}
      profileHref="/owner/profile?tab=verification"
      promptText="An admin must approve your account before you can list properties. Upload your documents to get started"
    />
  );
}

/** Verification notice for tenants and owners. Renders nothing until the status is known. */
export function VerificationBanner() {
  const { role } = useSession();
  if (role === "TENANT") return <TenantBanner />;
  if (role === "OWNER") return <OwnerBanner />;
  return null;
}
