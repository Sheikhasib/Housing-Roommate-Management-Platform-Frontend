import { unstable_cache } from "next/cache";
import { serverGuestApi } from "@/lib/api/serverApi";
import type { Paginated } from "@/types/api";
import type { PublicPropertySummary } from "@/types/property";
import type { PublicRoom } from "@/types/room";
import { ROOM_TYPES, type RoomType } from "@/validation/enums";

/** Same as the backend's own cache window for public lists. */
const HOME_REVALIDATE_SECONDS = 60;
const HERO_SLIDE_COUNT = 5;

type Query = Record<string, string | number>;

/** One section's data: `ok: false` lets that section show its own failure state. */
export type SectionResult<T> = { ok: true; data: T } | { ok: false };

/**
 * The cached readers are guest-only (no token, no cookies), so one cache entry is safe for every
 * viewer. A failed call throws, and a thrown call is never cached, so one bad call does not
 * freeze an error for 60 seconds.
 */
const readRooms = unstable_cache(
  (query: Query) => serverGuestApi<Paginated<PublicRoom>>("/room/public", { query }),
  ["home-rooms"],
  { revalidate: HOME_REVALIDATE_SECONDS },
);

const readProperties = unstable_cache(
  (query: Query) =>
    serverGuestApi<Paginated<PublicPropertySummary>>("/property/public", { query }),
  ["home-properties"],
  { revalidate: HOME_REVALIDATE_SECONDS },
);

function toResult<T>(settled: PromiseSettledResult<T>): SectionResult<T> {
  return settled.status === "fulfilled" ? { ok: true, data: settled.value } : { ok: false };
}

/** Distinct city names (case-insensitive), sorted, as the backend spelled them. */
function distinctCities(properties: PublicPropertySummary[]): string[] {
  const byKey = new Map<string, string>();
  for (const property of properties) {
    const city = property.city?.trim();
    if (city && !byKey.has(city.toLowerCase())) byKey.set(city.toLowerCase(), city);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

export interface HomeStats {
  roomsListed: SectionResult<number>;
  roomsAvailable: SectionResult<number>;
  properties: SectionResult<number>;
}

/** One room type card: the available count and the first photo of the room that call returned. */
export interface RoomTypeSummary {
  count: number;
  imageUrl: string | null;
}

export interface HomeData {
  heroRooms: SectionResult<PublicRoom[]>;
  /** Cities of the first 50 properties: the count for the stats strip and the search suggestions. */
  cities: SectionResult<string[]>;
  stats: HomeStats;
  roomTypeCounts: Record<RoomType, SectionResult<RoomTypeSummary>>;
  featuredRooms: SectionResult<PublicRoom[]>;
}

/** Everything the top half of Home needs. All calls run in parallel and fail independently. */
export async function getHomeData(): Promise<HomeData> {
  const [hero, listed, available, propertyTotal, propertyList, featured, typeCounts] =
    await Promise.allSettled([
      readRooms({ limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
      readRooms({ limit: 1, availability: "all" }),
      readRooms({ limit: 1 }),
      readProperties({ limit: 1 }),
      readProperties({ limit: 50 }),
      readRooms({ limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
      Promise.allSettled(ROOM_TYPES.map((type) => readRooms({ type, limit: 1 }))),
    ]);

  const heroResult = toResult(hero);
  const listedResult = toResult(listed);
  const availableResult = toResult(available);
  const propertyTotalResult = toResult(propertyTotal);
  const propertyListResult = toResult(propertyList);
  const featuredResult = toResult(featured);
  const typeResults = typeCounts.status === "fulfilled" ? typeCounts.value : [];

  const roomTypeCounts = Object.fromEntries(
    ROOM_TYPES.map((type, index) => {
      const settled = typeResults[index];
      const result: SectionResult<RoomTypeSummary> =
        settled?.status === "fulfilled"
          ? {
              ok: true,
              data: {
                count: settled.value.meta.total,
                imageUrl: settled.value.data[0]?.images?.[0]?.url ?? null,
              },
            }
          : { ok: false };
      return [type, result];
    }),
  ) as Record<RoomType, SectionResult<RoomTypeSummary>>;

  return {
    // Only rooms with a photo of their own become slides.
    heroRooms: heroResult.ok
      ? {
          ok: true,
          data: heroResult.data.data
            .filter((room) => (room.images?.length ?? 0) > 0)
            .slice(0, HERO_SLIDE_COUNT),
        }
      : { ok: false },
    cities: propertyListResult.ok
      ? { ok: true, data: distinctCities(propertyListResult.data.data) }
      : { ok: false },
    stats: {
      roomsListed: listedResult.ok ? { ok: true, data: listedResult.data.meta.total } : { ok: false },
      roomsAvailable: availableResult.ok
        ? { ok: true, data: availableResult.data.meta.total }
        : { ok: false },
      properties: propertyTotalResult.ok
        ? { ok: true, data: propertyTotalResult.data.meta.total }
        : { ok: false },
    },
    roomTypeCounts,
    featuredRooms: featuredResult.ok ? { ok: true, data: featuredResult.data.data } : { ok: false },
  };
}
