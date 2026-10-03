import { serverApi } from "@/lib/api/serverApi";
import type { Paginated } from "@/types/api";
import type { PublicRoom } from "@/types/room";
import type { RoomsFilters } from "@/validation/rooms-filter";

/** Guest view of published rooms (`GET /room/public`). Optional filters are sent only when set. */
export function getPublicRooms(filters: RoomsFilters): Promise<Paginated<PublicRoom>> {
  const query: Record<string, string | number> = {
    availability: filters.availability,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.searchTerm) query.searchTerm = filters.searchTerm;
  if (filters.city) query.city = filters.city;
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.type) query.type = filters.type;
  if (filters.minRent !== undefined) query.minRent = filters.minRent;
  if (filters.maxRent !== undefined) query.maxRent = filters.maxRent;
  if (filters.isFurnished) query.isFurnished = "true";

  return serverApi<Paginated<PublicRoom>>("/room/public", { query });
}
