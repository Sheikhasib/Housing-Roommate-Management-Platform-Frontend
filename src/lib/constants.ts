/**
 * Public site constants.
 *
 * TODO(owner): add the real social page URLs to SOCIAL_LINKS. Entries without
 * an href are shown as plain icons: never invent a URL.
 */
export const APP_NAME = "Neer";

export const APP_TAGLINE = "Ashroy for your next home";

export const APP_DESCRIPTION =
  "Find a room and a roommate, and manage your rent, leases and maintenance in one place.";

export interface ContactDetails {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export const CONTACT: ContactDetails = {
  email: "neer.support.bd@gmail.com",
  // Demo number for display only.
  phone: "+880 1000-123456",
  address: "Jashore, Khulna, Bangladesh",
  hours: "Sun to Thu, 10 AM to 6 PM",
};

export type SocialName =
  | "Email"
  | "Facebook"
  | "LinkedIn"
  | "GitHub"
  | "X"
  | "Instagram"
  | "YouTube";

export interface SocialLink {
  name: SocialName;
  /** Full external URL. Leave out until the real page address is known. */
  href?: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { name: "Email", href: "mailto:neer.support.bd@gmail.com" },
  { name: "Facebook" },
  { name: "LinkedIn" },
  { name: "GitHub" },
  { name: "X" },
  { name: "Instagram" },
  { name: "YouTube" },
];
