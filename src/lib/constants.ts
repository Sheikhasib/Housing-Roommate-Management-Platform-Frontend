/**
 * Public site constants.
 *
 * TODO(owner): fill in CONTACT and SOCIAL_LINKS with the real details.
 * They are intentionally empty: never invent contact details. The footer hides
 * every empty value, so nothing is shown until you add real ones.
 * APP_NAME is a working name until the owner confirms the final one.
 */
export const APP_NAME = "Housing Roommate";

export const APP_DESCRIPTION =
  "Find a room and a roommate, and manage your rent, leases and maintenance in one place.";

export interface ContactDetails {
  email: string;
  phone: string;
  address: string;
}

export const CONTACT: ContactDetails = {
  email: "",
  phone: "",
  address: "",
};

export interface SocialLink {
  label: string;
  /** Full external URL, for example the page address on that network. */
  href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [];
