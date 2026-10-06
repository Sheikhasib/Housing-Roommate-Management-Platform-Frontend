import { apiClient } from "@/lib/api/apiClient";
import type { ApiMeta, ApiSuccess } from "@/types/api";
import type {
  ManagerPropertyApiRow,
  OwnerRoomApiRow,
  OwnerRoomDetail,
  RoomRow,
} from "@/types/owner-room";

export interface OwnerRoomsQuery {
  page: number;
  limit: number;
  status?: string;
  /** "true" or "false". */
  isPublished?: string;
  propertyId?: string;
}

export interface OwnerRoomsResult {
  rows: RoomRow[];
  meta: ApiMeta;
}

/**
 * The manager endpoint pages by property and has no filters, so the manager list reads one page
 * of this many properties (the property picker uses the same size) and filters it here.
 */
export const MANAGER_PROPERTIES_LIMIT = 100;

function toRow(room: OwnerRoomApiRow): RoomRow {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    status: room.status,
    isPublished: room.isPublished,
    bedCount: room.bedCount,
    occupiedBeds: room.occupiedBeds,
    monthlyRent: room.monthlyRent,
    property: { id: room.property.id, title: room.property.title, city: room.property.city },
  };
}

/** OWNER reads `/room/my-rooms` (filters and paging by the backend). */
async function getOwnRooms(query: OwnerRoomsQuery): Promise<OwnerRoomsResult> {
  const { page, limit, status, isPublished, propertyId } = query;
  const response = await apiClient<ApiSuccess<OwnerRoomApiRow[]>>("/room/my-rooms", {
    query: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(isPublished ? { isPublished } : {}),
      ...(propertyId ? { propertyId } : {}),
    },
  });
  return {
    rows: response.data.map(toRow),
    meta: response.meta ?? { page: 1, limit, total: response.data.length, totalPages: 1 },
  };
}

/** PROPERTY_MANAGER builds the list from the rooms nested in `/manager/my-properties`. */
async function getManagedRooms(query: OwnerRoomsQuery): Promise<OwnerRoomsResult> {
  const response = await apiClient<ApiSuccess<ManagerPropertyApiRow[]>>("/manager/my-properties", {
    query: { page: 1, limit: MANAGER_PROPERTIES_LIMIT },
  });
  const rows = response.data
    .filter((property) => !query.propertyId || property.id === query.propertyId)
    .flatMap((property) =>
      property.rooms.map(
        (room): RoomRow => ({
          id: room.id,
          name: room.name,
          type: room.type,
          status: room.status,
          isPublished: room.isPublished,
          bedCount: room.bedCount,
          occupiedBeds: room.occupiedBeds,
          monthlyRent: room.monthlyRent,
          property: { id: property.id, title: property.title, city: property.city },
        }),
      ),
    )
    .filter((room) => !query.status || room.status === query.status)
    .filter((room) => !query.isPublished || String(room.isPublished) === query.isPublished);
  return { rows, meta: { page: 1, limit: rows.length, total: rows.length, totalPages: 1 } };
}

export function getRooms(isManager: boolean, query: OwnerRoomsQuery): Promise<OwnerRoomsResult> {
  return isManager ? getManagedRooms(query) : getOwnRooms(query);
}

export async function getOwnerRoom(roomId: string): Promise<OwnerRoomDetail> {
  const response = await apiClient<ApiSuccess<OwnerRoomDetail>>(
    `/room/${encodeURIComponent(roomId)}`,
  );
  return response.data;
}

/** Body is already parsed by CreateRoomZodSchema. */
export function createRoom(body: Record<string, unknown>) {
  return apiClient<ApiSuccess<{ id: string }>>("/room", { method: "POST", body });
}

export function updateRoom(roomId: string, body: Record<string, unknown>) {
  return apiClient<ApiSuccess<unknown>>(`/room/${encodeURIComponent(roomId)}`, {
    method: "PATCH",
    body,
  });
}

/** Status, publish flag or availableFrom: the only endpoint that may change them. */
export function setRoomAvailability(roomId: string, body: Record<string, unknown>) {
  return apiClient<ApiSuccess<unknown>>(`/room/${encodeURIComponent(roomId)}/availability`, {
    method: "PATCH",
    body,
  });
}

export function deleteRoom(roomId: string) {
  return apiClient<ApiSuccess<unknown>>(`/room/${encodeURIComponent(roomId)}`, {
    method: "DELETE",
  });
}

export function removeRoomImage(roomId: string, publicId: string) {
  return apiClient<ApiSuccess<unknown>>(`/room/${encodeURIComponent(roomId)}/images`, {
    method: "DELETE",
    body: { publicId },
  });
}
