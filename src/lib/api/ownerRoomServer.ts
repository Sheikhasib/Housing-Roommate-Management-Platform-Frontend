import { serverApi } from "@/lib/api/serverApi";
import type { ApiSuccess } from "@/types/api";
import type { OwnerRoomDetail } from "@/types/owner-room";

/** Room view for the owning OWNER or an assigned manager (drafts included), read with the user's token. */
export async function getRoomForOwnerSide(roomId: string): Promise<OwnerRoomDetail> {
  const response = await serverApi<ApiSuccess<OwnerRoomDetail>>(
    `/room/${encodeURIComponent(roomId)}`,
  );
  return response.data;
}
