import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from "@/validation/enums";

/**
 * One item of `GET /maintenance/my-requests` and the body of create and image upload
 * (backend spec 13). The room carries its property. `assignedTo` is an internal id, so no screen shows it.
 */
export interface TenantMaintenanceRequest {
  id: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: MaintenanceStatus;
  assignedTo: string | null;
  assignedAt: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  roomId: string;
  leaseId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present on list rows; the create and image responses return the bare row. */
  room?: { id: string; name: string; property: { id: string; title: string; city: string } };
}
