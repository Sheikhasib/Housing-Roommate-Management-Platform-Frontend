"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff, Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CloudinaryImage } from "@/types/room";

interface RoomGalleryProps {
  roomName: string;
  images: CloudinaryImage[];
}

/** Neutral stand-in when a room and its property have no photos. */
function RoomPhotoPlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
      <ImageOff className="size-10" aria-hidden="true" />
      <span className="sr-only">No photos available for this room</span>
    </div>
  );
}

/** Fills the right half of the desktop grid whatever the photo count (1 to 4 side photos). */
function sideSpan(count: number, index: number): string {
  if (count === 1) return "col-span-2 row-span-2";
  if (count === 2) return "col-span-2";
  if (count === 3 && index === 0) return "col-span-2";
  return "";
}

const GRID_SIZES = "(min-width: 1280px) 40vw, (min-width: 1024px) 45vw, 100vw";

function Photo({
  image,
  alt,
  sizes,
  priority = false,
}: {
  image: CloudinaryImage;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={image.url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
    />
  );
}

export function RoomGallery({ roomName, images }: RoomGalleryProps) {
  const [open, setOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border sm:aspect-16/9">
        <RoomPhotoPlaceholder />
      </div>
    );
  }

  const [main, ...rest] = images;
  const side = rest.slice(0, 4);
  const alt = (index: number) => `Photo ${index + 1} of ${images.length} of ${roomName}`;

  return (
    <>
      {/* Mobile: scroll-snap carousel */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:hidden"
        role="region"
        aria-label={`Photos of ${roomName}`}
        tabIndex={0}
      >
        {images.map((image, index) => (
          <div
            key={image.publicId}
            className="relative aspect-4/3 w-[88%] shrink-0 snap-center overflow-hidden rounded-xl bg-muted"
          >
            <Photo image={image} alt={alt(index)} sizes="88vw" priority={index === 0} />
            <span className="absolute right-3 bottom-3 rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
              {index + 1} / {images.length}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: one large image and a 2x2 grid */}
      <div className="relative hidden h-105 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid">
        <div
          className={`relative bg-muted ${side.length > 0 ? "col-span-2" : "col-span-4"} row-span-2`}
        >
          <Photo image={main} alt={alt(0)} sizes={GRID_SIZES} priority />
        </div>
        {side.map((image, index) => (
          <div key={image.publicId} className={`relative bg-muted ${sideSpan(side.length, index)}`}>
            <Photo image={image} alt={alt(index + 1)} sizes="(min-width: 1024px) 40vw, 50vw" />
          </div>
        ))}

        {images.length > 1 ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="absolute right-3 bottom-3 shadow-sm">
                <Images aria-hidden="true" />
                View all photos ({images.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Photos of {roomName}</DialogTitle>
                <DialogDescription>
                  {images.length} {images.length === 1 ? "photo" : "photos"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {images.map((image, index) => (
                  <div
                    key={image.publicId}
                    className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted"
                  >
                    <Photo image={image} alt={alt(index)} sizes="(min-width: 640px) 400px, 90vw" />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </>
  );
}
