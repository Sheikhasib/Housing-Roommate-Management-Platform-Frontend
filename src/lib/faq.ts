/**
 * Shared FAQ list: the Home page shows the first HOME_FAQ_COUNT, the Help page shows all.
 * Every answer restates a rule from docs/backend-specs (05 to 12). Add an entry only after
 * checking that spec, and leave out any detail the spec does not state.
 */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  /** Optional link shown under the answer. */
  link?: { href: string; label: string };
}

export const HOME_FAQ_COUNT = 5;

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "tenant-verification",
    question: "Do tenants need to verify their identity?",
    answer:
      "Yes, before paying. A tenant uploads an identity document (such as a national ID) and an admin approves or rejects it. Only approved tenants can start a payment, such as the booking deposit. Browsing rooms, requesting viewings, roommate matching and applying stay open to every tenant.",
  },
  {
    id: "owner-verification",
    question: "Do owners need to be verified before listing?",
    answer:
      "Yes. An owner uploads identity documents and requests a review, then an admin approves or rejects the account. Only approved owners can manage properties and rooms.",
  },
  {
    id: "viewing-requests",
    question: "How do viewing requests work?",
    answer:
      "A tenant picks a published room, a preferred date and a morning, afternoon or evening slot, and can add a message. The owner or the assigned property manager approves the request, rejects it with a reason, or marks it completed after the viewing. A tenant can cancel while the request is pending or approved, and can have one pending request per room.",
  },
  {
    id: "applications",
    question: "How do applications work, and do they expire?",
    answer:
      "A tenant applies to a published room with a move-in date and a lease length. The owner or assigned property manager approves the application, or rejects it with a reason. A tenant can cancel while it is pending or approved, unless a payment is already paid or in progress. Pending applications older than 14 days are expired automatically by the system.",
  },
  {
    id: "booking-deposit",
    question: "How is the booking deposit paid, and what happens next?",
    answer:
      "Once an application is approved, a verified tenant can pay the booking deposit online. The amount is the room's booking deposit, or one month's rent when the room has no deposit set. When the payment provider confirms the payment, the lease is created as active and a bed in the room is taken. A failed payment does not change anything: the application stays approved.",
  },
  {
    id: "payment-gateways",
    question: "Which payment gateways can I use?",
    answer:
      "bKash, SSLCommerz and Stripe. At checkout you only see the gateways that are enabled. A payment counts as paid only after the gateway confirms it.",
  },
  {
    id: "lease-termination",
    question: "What happens to my deposit if a lease is terminated?",
    answer:
      "A lease can be terminated while it is active by the tenant, the owner or an admin, with a written reason. If the deposit was paid and the lease start date is still in the future, the deposit is refunded. If the lease has already started, there is no refund. Terminating also frees the bed and cancels the lease's unpaid and processing invoices. SSLCommerz deposits have no automated refund: they are held for an admin to refund.",
  },
  {
    id: "roommate-matching",
    question: "How does roommate matching work?",
    answer:
      "Tenants who are looking for a roommate get a ranked list of other tenants, each scored from 0 to 100 on preferred city, budget, smoking, pets and move-in date. A tenant sends a roommate request and the other tenant accepts or declines it. Accepting creates a roommate pair. Contact details are not shown to the other tenant before then.",
  },
  {
    id: "contact-support",
    question: "How do I contact support?",
    answer: "Use the Contact page to send us a message.",
    link: { href: "/contact", label: "Go to the Contact page" },
  },
];
