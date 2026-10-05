"use client";

import Image from "next/image";
import { ExternalLink, FileText, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { VerificationDocument } from "@/types/profile";

function isPdf(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

interface VerificationDocumentsProps {
  documents: readonly VerificationDocument[];
  /** When set, each document gets a remove button that asks first. */
  onRemove?: (publicId: string) => Promise<void>;
}

/** Image thumbnails, and file chips for PDFs that open in a new tab. */
export function VerificationDocuments({ documents, onRemove }: VerificationDocumentsProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {documents.map((document, index) => {
        const label = `Document ${index + 1}`;
        return (
          <li
            key={document.publicId}
            className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            {isPdf(document.url) ? (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 bg-muted px-2 text-center transition-colors duration-150 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <FileText className="size-8 text-muted-foreground" aria-hidden="true" />
                <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                  {label} (PDF)
                  <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">opens in a new tab</span>
                </span>
              </a>
            ) : (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-4/3 w-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Image
                  src={document.url}
                  alt={`${label}, opens full size in a new tab`}
                  fill
                  sizes="(min-width: 768px) 200px, (min-width: 640px) 30vw, 45vw"
                  className="object-cover"
                />
              </a>
            )}
            {onRemove ? (
              <ConfirmDialog
                destructive
                title="Remove this document?"
                description={`${label} will be removed from your verification documents. You can upload it again later.`}
                confirmLabel="Remove document"
                onConfirm={() => onRemove(document.publicId)}
                trigger={
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label={`Remove ${label}`}
                    className="absolute top-1 right-1 size-10 rounded-full shadow-sm"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                }
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
