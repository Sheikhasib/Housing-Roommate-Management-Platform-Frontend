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
    <HeroSlider slides={slides}>
      <div className="relative h-full">
        <div className="flex h-full items-end pb-14 lg:items-center lg:pb-0">
          <div className="w-full rounded-xl border border-border bg-card p-4 text-card-foreground shadow-md sm:p-6 lg:max-w-xl">
            <h1 className="text-xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
              Find a room and a roommate<span className="hidden sm:inline"> you can trust</span>
            </h1>
            <p className="mt-2 hidden text-base text-muted-foreground sm:block">
              Browse real rooms, book a viewing, and pay your deposit online.
            </p>
            <div className="mt-3 sm:mt-5">
              <HeroSearch cities={cities} />
            </div>
          </div>
        </div>

        <a
          href={`#${HERO_NEXT_SECTION_ID}`}
          className="absolute bottom-3 left-1/2 inline-flex h-10 -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm outline-none transition-shadow duration-150 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Explore
          <ChevronDown
            className="size-4 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </a>
      </div>
    </HeroSlider>
  );
}
