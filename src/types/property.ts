import type { PropertyType } from "@/validation/enums";
import type { CloudinaryImage, PublicOwner } from "@/types/room";

/** The part of one published room that `GET /property/public` nests under a property. */
export interface PublicPropertyRoom {
  id: string;
  monthlyRent: string;
}

/** One item of `GET /property/public`. `rooms` are published rooms, cheapest first. */
export interface PublicPropertySummary {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  city: string;
  area: string | null;
  images: CloudinaryImage[] | null;
  owner: PublicOwner;
  rooms: PublicPropertyRoom[];
  _count: { rooms: number };
}
