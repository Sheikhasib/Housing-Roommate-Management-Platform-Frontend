/**
 * Privacy and Terms content. Every statement restates a rule from docs/backend-specs (specs 01 to
 * 17). Add a sentence only after checking the spec, and leave out anything the specs do not state.
 * The owner reviews both documents before submission.
 */

/** The date both documents were last edited, as YYYY-MM-DD. */
export const LEGAL_LAST_UPDATED = "2026-10-05";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  /** Renders the contact details from `CONTACT` after the text. */
  showContact?: boolean;
}

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    paragraphs: ["We collect only what the platform needs to work. This is what we keep:"],
    items: [
      "Account details: your name, email address and role (tenant, owner or property manager). If you sign in with Google, we use the name, email address and picture from your Google account.",
      "Profile details: tenants can add a contact number, occupation, bio, gender, preferred city, monthly budget, move-in date, and smoking and pet details for roommate matching. Owners can add a contact number, company name and address. Property managers can add a contact number and a bio.",
      "Verification documents: tenants upload an identity document, such as a national ID, and owners upload identity documents. Files are images or PDFs, and they are stored with our file storage provider, Cloudinary.",
      "Activity on the platform: viewing requests, applications (move-in date, lease length and your message), leases, invoices, maintenance requests and your notifications.",
      "Payment references: a record of each payment with the gateway used, the amount, its status and any refund details.",
    ],
  },
  {
    id: "card-data",
    title: "Card data",
    paragraphs: [
      "Card data never touches this site. When you pay, you are sent to the gateway (bKash, SSLCommerz or Stripe), which processes the payment. We only receive the result of the payment from the gateway.",
    ],
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    items: [
      "To create and run your account and keep you signed in.",
      "To let admins review verification documents and approve or reject accounts.",
      "To process viewing requests, applications, leases, invoices and maintenance requests.",
      "To take payments and refunds through the gateways.",
      "To send you notifications and emails about these actions, such as an approved or rejected application or a terminated lease.",
      "To score tenants from 0 to 100 for roommate matching.",
      "To keep an audit log of important actions on the platform.",
    ],
  },
  {
    id: "who-can-see-it",
    title: "Who can see it",
    paragraphs: ["What others can see depends on their role:"],
    items: [
      "You can see your own profile, applications, leases and payments.",
      "Owners can see the applications for rooms in their properties, including the applicant's name, email address, contact number and occupation. They can also see the leases of those properties and the payment details of their own applications and leases.",
      "Property managers can see the applications and leases of the properties they are assigned to. Their access to leases is view-only, and they cannot see payment details.",
      "Admins can view any application and any lease. They also review the verification documents that tenants and owners submit.",
      "Other tenants who are looking for a roommate can see a short card with your name, picture, occupation, bio, preferred city, budget, move-in date, smoking and pet details, and gender. Your email address, contact number and date of birth are not part of that card.",
      "Anyone can browse published rooms and properties without an account.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    items: [
      "Session cookies: when you sign in, two httpOnly cookies, accessToken and refreshToken, keep you signed in. Because they are httpOnly, scripts on the page cannot read them. The access token lasts 24 hours and the refresh token lasts 7 days. Signing out clears both cookies.",
      "Theme preference: your light or dark choice is saved in your browser so it is remembered on your next visit.",
    ],
  },
  {
    id: "retention",
    title: "Retention",
    paragraphs: [
      "We have not set fixed retention periods in the platform, so we do not promise any. This is what the platform does today:",
    ],
    items: [
      "While you register, your sign-up details and the 6-digit code are held for 5 minutes. After that you have to register again.",
      "Many records, such as properties, rooms, applications, leases, invoices, maintenance requests and profiles, are marked as deleted when they are removed. They are left out of normal views instead of being erased on the spot.",
      "Payment records, notifications and audit log entries have no deleted marker. The audit log is append-only and can only be read.",
      "When an owner removes a verification document, it is taken off their profile first. We then ask our file storage provider to delete the file.",
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      "Passwords are stored hashed, never as plain text.",
      "Session cookies are httpOnly, and sign-in attempts are rate limited.",
      "The server checks your role on every request, so you cannot reach data meant for another role.",
      "A payment counts as paid only after the gateway confirms it to our server.",
      "Important actions are written to the audit log.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices",
    items: [
      "You can update your profile details at any time.",
      "Tenants can change their roommate-matching details. Only tenants who are looking for a roommate appear in matches.",
      "Owners can remove their uploaded verification documents, and tenants can upload a new one.",
      "You can cancel an application while it is pending or approved, unless a payment is already paid or in progress.",
      "You can sign out at any time, which clears your session cookies.",
      "For anything you cannot do from your account, write to us at the address below.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: ["Questions about this policy? Contact us:"],
    showContact: true,
  },
];

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance",
    paragraphs: [
      "By creating an account or using Neer you agree to these terms. If you do not agree, please do not use the platform.",
    ],
  },
  {
    id: "accounts-and-verification",
    title: "Accounts and verification",
    items: [
      "You can register as a tenant, an owner or a property manager. Admin accounts cannot be created by registering.",
      "To register with email, you confirm your email address with a 6-digit code that is valid for 5 minutes. You can also sign in with Google.",
      "Tenants must upload an identity document, and an admin must approve it, before they can pay. Browsing rooms, requesting viewings, roommate matching and applying are open to every tenant.",
      "Owners must be approved by an admin before they can manage properties and rooms. An owner can ask for a new review after a rejection.",
      "Verification documents are images or PDFs of up to 8 MB.",
      "An admin can block an account. A blocked account cannot use the platform.",
    ],
  },
  {
    id: "listings-and-applications",
    title: "Listings and applications",
    items: [
      "Only approved owners can create properties and rooms. A room is visible to tenants when it is published. The owner sets its rent and any booking deposit.",
      "A tenant can request a viewing of a published room with a preferred date and a morning, afternoon or evening slot. A tenant can have one pending request per room.",
      "A tenant applies to a published room with a move-in date and a lease length. A tenant can have only one pending or approved application for the same room at a time.",
      "The owner or the assigned property manager approves an application, or rejects it with a reason. Approving an application does not create a lease. A lease is created when the booking deposit is paid.",
      "A tenant can cancel an application while it is pending or approved, unless a payment is already paid or in progress.",
      "Pending applications older than 14 days are expired automatically by the system.",
    ],
  },
  {
    id: "deposits-and-payments",
    title: "Deposits and payments",
    items: [
      "Payments are made through bKash, SSLCommerz or Stripe. At checkout you only see the gateways that are enabled.",
      "The booking deposit is the room's booking deposit, or one month's rent when the room has no deposit set.",
      "A payment counts as paid only after the gateway confirms it. When the deposit is confirmed, the lease is created as active and a bed in the room is taken. A failed payment changes nothing: the application stays approved.",
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    paragraphs: [
      "In short: you get your deposit back only if it was paid and the lease start date is still in the future. Once the lease has started, there is no refund.",
    ],
    items: [
      "Who can end a lease: while a lease is active, the tenant, the owner or an admin can end it. They must give a written reason. Property managers cannot end a lease.",
      "How a refund is paid: for bKash and Stripe deposits, we try to refund the deposit automatically. SSLCommerz deposits have no automated refund, so they are held for an admin to refund.",
      "If we cannot tell whether a refund went through, it is held for an admin to review. It is not retried automatically.",
      "What else happens when a lease ends: the bed is freed, and the lease's unpaid and processing invoices are cancelled.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: [
      "Use Neer to find, rent and manage homes. The platform enforces these rules, and they apply to everyone:",
    ],
    items: [
      "Actions are tied to your signed-in role. You can only do what your role allows.",
      "Sign-in attempts are rate limited.",
      "An admin can block an account, and a blocked account is turned away on its next request.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    items: [
      "Owners set the rent, the deposit and the details of their rooms. A lease is between the tenant and the owner of the room.",
      "Neer treats a payment as paid only when the gateway confirms it. If the outcome of a payment or refund is unclear, it is held for an admin to review instead of being guessed.",
      "Property managers see only what an owner assigns them and cannot take money actions.",
    ],
  },
  {
    id: "changes",
    title: "Changes",
    paragraphs: [
      "We may change these terms. The \"Last updated\" date at the top of this page shows when they were last changed.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: ["Questions about these terms? Contact us:"],
    showContact: true,
  },
];
