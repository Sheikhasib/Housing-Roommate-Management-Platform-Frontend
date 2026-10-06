"use client";

import Image from "next/image";
import { ImageOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FileUploader } from "@/components/shared/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { removePropertyImage } from "@/lib/api/ownerProperty";
import type { PropertyDetail } from "@/types/property";
import { errorMessage, useRefreshProperty } from "../../_hooks/use-property-queries";

const MAX_IMAGES = 10;
const GALLERY_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

export function PropertyImages({ property }: { property: PropertyDetail }) {
  const refresh = useRefreshProperty(property.id);
  const images = property.images ?? [];
  const remaining = MAX_IMAGES - images.length;

  const confirmRemove = async (publicId: string) => {
    try {
      const response = await removePropertyImage(property.id, publicId);
      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Add photos</CardTitle>
          <CardDescription>
            {images.length} of {MAX_IMAGES} photos used.
            {remaining === 0 ? " Remove a photo to add another." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            kind="image"
            fieldName="images"
            url={`/property/${encodeURIComponent(property.id)}/images`}
            maxFiles={Math.max(remaining, 1)}
            disabled={remaining === 0}
            label="Choose property photos"
            onUploaded={(response) => {
              toast.success(response.message);
              refresh();
            }}
            onError={(error) => toast.error(error.errors[0]?.message || error.message)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Gallery</CardTitle>
          <CardDescription>The first photo is the cover shown on cards.</CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <EmptyState
              icon={ImageOff}
              title="No photos yet"
              description="Upload photos above so tenants can see the property."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image, index) => (
                <li
                  key={image.publicId}
                  className="relative overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <div className="relative aspect-4/3 w-full bg-muted">
                    <Image
                      src={image.url}
                      alt={`${property.title}, photo ${index + 1}`}
                      fill
                      sizes={GALLERY_SIZES}
                      className="object-cover"
                    />
                  </div>
                  <ConfirmDialog
                    destructive
                    title="Remove this photo?"
                    description="The photo is removed from this property. This cannot be undone."
                    confirmLabel="Remove photo"
                    onConfirm={() => confirmRemove(image.publicId)}
                    trigger={
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        aria-label={`Remove photo ${index + 1}`}
                        className="absolute top-1 right-1 size-10 rounded-full shadow-sm"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
