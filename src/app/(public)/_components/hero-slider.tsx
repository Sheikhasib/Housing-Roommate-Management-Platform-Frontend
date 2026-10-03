"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  name: string;
  city: string;
  /** Already formatted, for example "৳12,000". */
  rent: string;
  href: string;
  imageUrl: string;
}

const ADVANCE_MS = 6000;
const SWIPE_DISTANCE = 50;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

interface HeroSliderProps {
  slides: HeroSlide[];
  /** The hero content (headline, search, Explore link) that sits on top of the photos. */
  children: ReactNode;
}

/**
 * The hero shell. Real room photos fill the background and the content sits in solid panels on
 * top, so the photos get no overlay. With fewer than 2 slides it shows one static slide.
 */
export function HeroSlider({ slides, children }: HeroSliderProps) {
  const count = slides.length;
  const canSlide = count > 1;
  const reducedMotion = usePrefersReducedMotion();

  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const index = count > 0 ? current % count : 0;
  const paused = hovered || focused;
  const autoAdvance = canSlide && !paused && !reducedMotion;

  const go = (next: number) => setCurrent((next + count) % count);

  // The timer restarts after every change, so a manual click gets a full 6 seconds too.
  useEffect(() => {
    if (!autoAdvance) return;
    const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % count), ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [autoAdvance, index, count]);

  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured rooms"
      className="relative h-[60vh] max-h-[70vh] overflow-hidden bg-muted md:h-[65vh]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
      }}
      onTouchEnd={(event) => {
        if (!touchStart || !canSlide) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStart.x;
        const dy = touch.clientY - touchStart.y;
        setTouchStart(null);
        if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
          go(dx < 0 ? index + 1 : index - 1);
        }
      }}
    >
      <div className="absolute inset-0">
        {slides.map((item, position) => (
          <div
            key={item.id}
            aria-hidden={position !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none",
              position === index ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={item.imageUrl}
              alt={`Photo of ${item.name}`}
              fill
              sizes="100vw"
              priority={position === 0}
              className="object-cover"
            />
          </div>
        ))}
        {count === 0 ? (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-10" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}

        {slide ? (
          <div className="absolute inset-x-4 top-3 flex items-start gap-2 sm:inset-x-6 lg:inset-x-auto lg:top-auto lg:right-8 lg:bottom-16 lg:w-96">
            <div
              className="min-w-0 flex-1 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm"
              aria-live={autoAdvance ? "off" : "polite"}
            >
              <Link
                href={slide.href}
                className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="block truncate text-sm font-semibold text-foreground">
                  {slide.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {slide.city} · {slide.rent} / month
                </span>
              </Link>

              {canSlide ? (
                <div className="mt-1 flex items-center" role="group" aria-label="Choose a room">
                  {slides.map((item, position) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Show room ${position + 1} of ${count}: ${item.name}`}
                      aria-current={position === index ? "true" : undefined}
                      onClick={() => go(position)}
                      className="group relative flex h-6 w-6 items-center justify-center rounded-full outline-none after:absolute after:inset-x-0 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-7 lg:w-7"
                    >
                      <span
                        className={cn(
                          "block size-2 rounded-full transition-colors duration-150",
                          position === index
                            ? "bg-primary"
                            : "bg-input group-hover:bg-muted-foreground",
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {canSlide ? (
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Previous room"
                  onClick={() => go(index - 1)}
                  className="bg-card shadow-sm"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Next room"
                  onClick={() => go(index + 1)}
                  className="bg-card shadow-sm"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
