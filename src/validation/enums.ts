export const ROLES = ["SUPER_ADMIN", "ADMIN", "OWNER", "PROPERTY_MANAGER", "TENANT"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "BLOCKED", "DELETED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];

export const VERIFICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOSTEL",
  "DORMITORY",
  "VILLA",
  "SHARED_HOUSE",
  "OTHER",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const ROOM_TYPES = ["PRIVATE_ROOM", "SHARED_ROOM", "ENTIRE_FLAT", "BED"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_STATUSES = ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const VIEWING_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];

export const VIEWING_TIME_SLOTS = ["MORNING", "AFTERNOON", "EVENING"] as const;
export type ViewingTimeSlot = (typeof VIEWING_TIME_SLOTS)[number];

export const ROOMMATE_REQUEST_STATUSES = ["PENDING", "ACCEPTED", "DECLINED"] as const;
export type RoommateRequestStatus = (typeof ROOMMATE_REQUEST_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["PENDING", "ACTIVE", "REJECTED", "REMOVED"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const LEASE_STATUSES = ["ACTIVE", "COMPLETED", "TERMINATED"] as const;
export type LeaseStatus = (typeof LEASE_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PURPOSES = ["DEPOSIT", "RENT", "UTILITY"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_GATEWAYS = ["BKASH", "SSLCOMMERZ", "STRIPE"] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

// Gateway values the backend expects in requests are lowercase.
export const PAYMENT_GATEWAY_REQUEST_VALUES = ["bkash", "sslcommerz", "stripe"] as const;
export type PaymentGatewayRequestValue = (typeof PAYMENT_GATEWAY_REQUEST_VALUES)[number];

export const INVOICE_TYPES = ["RENT", "UTILITY"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = [
  "UNPAID",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const MAINTENANCE_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const MAINTENANCE_CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "APPLIANCE",
  "FURNITURE",
  "PAINTING",
  "CLEANING",
  "OTHER",
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const NOTIFICATION_TYPES = [
  "APPLICATION",
  "VIEWING",
  "PAYMENT",
  "LEASE",
  "MAINTENANCE",
  "INVOICE",
  "ROOMMATE",
  "SYSTEM",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
