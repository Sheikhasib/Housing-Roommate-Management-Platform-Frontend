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

/**
 * One item of `GET /maintenance/owner-requests` (backend spec 13). The room has no property here.
 * `assignedTo` is an internal id, so no screen shows it. The status and image calls return the bare row.
 */
export interface OwnerMaintenanceRequest {
  id: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: MaintenanceStatus;
  assignedAt: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  roomId: string;
  leaseId: string | null;
  createdAt: string;
  updatedAt: string;
  room?: { id: string; name: string };
  tenantProfile?: {
    id: string;
    name: string;
    email: string;
    contactNumber: string | null;
    user: { imageUrl: string | null } | null;
  };
}
