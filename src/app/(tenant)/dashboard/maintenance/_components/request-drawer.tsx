"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { FileUploader } from "@/components/shared/file-uploader";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { requestPhotoUrl } from "@/lib/api/maintenance";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABELS, plainMaintenanceError } from "@/lib/maintenance-labels";
import type { TenantMaintenanceRequest } from "@/types/maintenance";
import { useRefreshMaintenance } from "../_hooks/use-maintenance-queries";

interface FactProps {
  label: string;
  children: ReactNode;
}

function Fact({ label, children }: FactProps) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

interface RequestDrawerProps {
  request: TenantMaintenanceRequest | null;
  onClose: () => void;
}

export function RequestDrawer({ request, onClose }: RequestDrawerProps) {
  const refresh = useRefreshMaintenance();

  return (
    <Sheet open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {request ? (
          <>
            <SheetHeader>
              <SheetTitle>{request.title}</SheetTitle>
              <SheetDescription>
                {request.room
                  ? `${request.room.name}, ${request.room.property.title} (${request.room.property.city})`
                  : "Your maintenance request"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={request.status} />
                <StatusBadge status={request.priority} />
              </div>

              <dl className="grid grid-cols-2 gap-4">
                <Fact label="Type of problem">{CATEGORY_LABELS[request.category]}</Fact>
                <Fact label="Sent on">{formatDate(request.createdAt)}</Fact>
                {request.assignedAt ? (
                  <Fact label="Assignment">Assigned on {formatDate(request.assignedAt)}</Fact>
                ) : null}
                {request.resolvedAt ? (
                  <Fact label="Resolution">Resolved on {formatDate(request.resolvedAt)}</Fact>
                ) : null}
              </dl>

              <section className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Description</h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {request.description || "No description was added."}
                </p>
              </section>

              {request.resolutionNotes ? (
                <section className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Resolution notes</h3>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {request.resolutionNotes}
                  </p>
                </section>
              ) : null}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Photo</h3>
                {request.imageUrl ? (
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border bg-muted">
                    <Image
                      src={request.imageUrl}
                      alt={`Photo for ${request.title}`}
                      fill
                      sizes="(min-width: 640px) 28rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No photo has been added yet.</p>
                )}
                {request.imageUrl ? (
                  <p className="text-sm text-muted-foreground">This will replace the current photo.</p>
                ) : null}
                <FileUploader
                  key={`${request.id}-${request.imageUrl ?? "none"}`}
                  kind="image"
                  fieldName="image"
                  url={requestPhotoUrl(request.id)}
                  label={request.imageUrl ? "Choose a new photo" : "Add a photo"}
                  onUploaded={(response) => {
                    toast.success(response.message);
                    refresh();
                  }}
                  onError={(error) => toast.error(plainMaintenanceError(error))}
                />
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
