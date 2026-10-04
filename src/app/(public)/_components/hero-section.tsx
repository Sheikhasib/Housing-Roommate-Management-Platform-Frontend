import { ChevronDown } from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { PublicRoom } from "@/types/room";
import { HeroSearch } from "./hero-search";
import { HeroSlider, type HeroSlide } from "./hero-slider";

/** Where the Explore link scrolls to: the first section under the hero. */
export const HERO_NEXT_SECTION_ID = "home-stats";

function toSlide(room: PublicRoom): HeroSlide | null {
  const image = room.images?.[0];
  if (!image) return null;
  return {
    id: room.id,
    name: room.name,
    city: room.property.city,
    rent: formatMoney(room.monthlyRent),
    href: `/rooms/${room.id}`,
    imageUrl: image.url,
  };
}

interface HeroSectionProps {
  rooms: PublicRoom[];
  cities: string[];
}

export function HeroSection({ rooms, cities }: HeroSectionProps) {
  const slides = rooms.map(toSlide).filter((slide): slide is HeroSlide => slide !== null);

  return (
    // The bottom padding is the room the search bar needs where it hangs below the photo.
    <div className="bg-background pb-16 lg:pb-12">
      <HeroSlider slides={slides}>
        <div className="relative h-full">
          <div className="pt-4 sm:pt-6 lg:pt-8">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 text-card-foreground shadow-md sm:p-5">
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                Find a room and a roommate<span className="hidden sm:inline"> you can trust</span>
              </h1>
              <p className="mt-2 hidden text-base text-muted-foreground sm:block">
                Browse real rooms, book a viewing, pay online.
              </p>
            </div>
          </div>

          <a
            href={`#${HERO_NEXT_SECTION_ID}`}
            className="absolute bottom-[4.5rem] left-1/2 inline-flex h-10 -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm outline-none transition-shadow duration-150 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 lg:bottom-14"
          >
            Explore
            <ChevronDown
              className="size-4 animate-bounce motion-reduce:animate-none"
              aria-hidden="true"
            />
          </a>

          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-1/2">
            <HeroSearch cities={cities} />
          </div>
        </div>
      </HeroSlider>
    </div>
  );
}
