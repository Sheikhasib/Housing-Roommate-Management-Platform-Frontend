import { serverApi, serverGuestApi } from "@/lib/api/serverApi";
import type { ApiSuccess, Paginated } from "@/types/api";
import type { PublicRoom, RoomDetail } from "@/types/room";
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

/** Guest view of one published room. Throws ApiError (404 when it does not exist or is a draft). */
export async function getRoomById(roomId: string): Promise<RoomDetail> {
  const { data } = await serverGuestApi<ApiSuccess<RoomDetail>>(
    `/room/${encodeURIComponent(roomId)}`,
  );
  return data;
}

/** Other rooms in the same city. Asks for 5 so that dropping the current room still leaves 4. */
export async function getRelatedRooms(city: string, currentRoomId: string): Promise<PublicRoom[]> {
  const { data } = await serverGuestApi<Paginated<PublicRoom>>("/room/public", {
    query: { city, limit: 5 },
  });
  return data.filter((room) => room.id !== currentRoomId).slice(0, 4);
}
