"use client";

import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clock, FileUp, Loader2, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { FileUploader } from "@/components/shared/file-uploader";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerificationDocuments } from "@/components/shared/verification-documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OWNER_QUERY_KEY, TENANT_QUERY_KEY, useInvalidateProfile } from "@/hooks/useProfile";
import { ApiError } from "@/lib/api/apiError";
import { removeOwnerDocument, requestOwnerVerification } from "@/lib/api/profile";
import type { OwnerProfile, TenantProfile } from "@/types/profile";
import type { VerificationStatus } from "@/validation/enums";

type VerificationDocumentList = NonNullable<OwnerProfile["documents"]>;

function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.errors[0]?.message || error.message;
  return "Something went wrong. Try again";
}

interface StatusPanelProps {
  status: VerificationStatus;
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}

function StatusPanel({ status, icon: Icon, title, children }: StatusPanelProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <StatusBadge status={status} />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

/** The rejection reason exactly as the admin wrote it. */
function RejectionReason({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return (
    <p>
      Reason from the reviewer: <span className="text-foreground">{reason}</span>
    </p>
  );
}

export function TenantVerification({ profile }: { profile: TenantProfile }) {
  const invalidate = useInvalidateProfile();
  const { verificationStatus: status, verificationDocUrl: docUrl } = profile;
  const hasDocument = Boolean(docUrl);
  const canUpload = !hasDocument || status === "REJECTED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Identity verification</CardTitle>
        <CardDescription>Upload an identity document so you can pay deposits and invoices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "APPROVED" ? (
          <StatusPanel status={status} icon={ShieldCheck} title="Your identity is verified">
            <p>You can pay deposits and invoices.</p>
          </StatusPanel>
        ) : status === "REJECTED" ? (
          <StatusPanel status={status} icon={XCircle} title="Your document was not approved">
            <RejectionReason reason={profile.rejectionReason} />
            <p>Submit a new document to be reviewed again.</p>
          </StatusPanel>
        ) : hasDocument ? (
          <StatusPanel status={status} icon={Clock} title="Waiting for admin review">
            <p>We will notify you as soon as an admin has reviewed your document.</p>
          </StatusPanel>
        ) : (
          <StatusPanel status={status} icon={FileUp} title="Upload your identity document">
            <p>An admin reviews it before you can pay deposits and invoices.</p>
          </StatusPanel>
        )}

        {docUrl ? (
          <VerificationDocuments documents={[{ url: docUrl, publicId: docUrl }]} />
        ) : null}

        {canUpload ? (
          <FileUploader<TenantProfile>
            kind="document"
            fieldName="document"
            url="/tenant/verification-document"
            method="PATCH"
            label={status === "REJECTED" ? "Submit a new document" : "Choose your identity document"}
            onUploaded={(response) => {
              invalidate(TENANT_QUERY_KEY);
              toast.success(response.message);
            }}
            onError={(error) => toast.error(errorText(error))}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OwnerVerification({ profile }: { profile: OwnerProfile }) {
  const invalidate = useInvalidateProfile();
  const { verificationStatus: status } = profile;
  const documents = profile.documents ?? [];
  const pending = status === "PENDING";

  const removal = useMutation({ mutationFn: removeOwnerDocument });
  const request = useMutation({ mutationFn: requestOwnerVerification });

  const handleRemove = async (publicId: string) => {
    try {
      const response = await removal.mutateAsync(publicId);
      invalidate(OWNER_QUERY_KEY);
      toast.success(response.message);
    } catch (error) {
      toast.error(errorText(error));
      throw error;
    }
  };

  const handleRequest = async () => {
    try {
      const response = await request.mutateAsync();
      invalidate(OWNER_QUERY_KEY);
      toast.success(response.message);
    } catch (error) {
      toast.error(errorText(error));
      invalidate(OWNER_QUERY_KEY);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Business verification</CardTitle>
        <CardDescription>An admin must approve your account before you can list properties.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "APPROVED" ? (
          <StatusPanel status={status} icon={ShieldCheck} title="Your account is verified">
            <p>You can list properties and rooms.</p>
          </StatusPanel>
        ) : status === "REJECTED" ? (
          <StatusPanel status={status} icon={XCircle} title="Your account was not approved">
            <RejectionReason reason={profile.rejectionReason} />
            <p>Update your documents, then submit again.</p>
          </StatusPanel>
        ) : documents.length > 0 ? (
          <StatusPanel status={status} icon={Clock} title="Waiting for admin review">
            <p>We will notify you as soon as an admin has reviewed your documents.</p>
          </StatusPanel>
        ) : (
          <StatusPanel status={status} icon={FileUp} title="Upload your documents">
            <p>Upload your documents, then request verification.</p>
          </StatusPanel>
        )}

        {documents.length > 0 ? (
          <VerificationDocuments documents={documents} onRemove={handleRemove} />
        ) : null}

        <FileUploader<VerificationDocumentList>
          kind="document"
          fieldName="documents"
          url="/owner/verification-documents"
          method="POST"
          maxFiles={5}
          label="Choose business documents"
          onUploaded={(response) => {
            invalidate(OWNER_QUERY_KEY);
            toast.success(response.message);
          }}
          onError={(error) => toast.error(errorText(error))}
        />

        {status !== "APPROVED" ? (
          <div className="flex flex-col items-end gap-1.5">
            <Button
              type="button"
              onClick={() => void handleRequest()}
              disabled={pending || documents.length === 0 || request.isPending}
            >
              {request.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {request.isPending ? "Sending request" : "Request verification"}
            </Button>
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">Upload at least one document first.</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
