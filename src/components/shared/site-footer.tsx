import Link from "next/link";
import { Building2, Globe, Mail, MapPin, Phone } from "lucide-react";

import { APP_NAME, CONTACT, SOCIAL_LINKS } from "@/lib/constants";

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
] as const;

const SUPPORT_LINKS = [
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

const linkClass =
  "rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none";

export function SiteFooter() {
  const hasContact = Boolean(CONTACT.email || CONTACT.phone || CONTACT.address);

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4" aria-hidden />
            </span>
            {APP_NAME}
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Find a room and a roommate, and manage rent, leases and maintenance in one place.
          </p>
          {SOCIAL_LINKS.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  >
                    <Globe className="size-4" aria-hidden />
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Explore" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Explore</h2>
          <ul className="space-y-2">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Support" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Support</h2>
          <ul className="space-y-2">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {hasContact ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Contact</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CONTACT.address ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{CONTACT.address}</span>
                </li>
              ) : null}
              {CONTACT.email ? (
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a href={`mailto:${CONTACT.email}`} className={linkClass}>
                    {CONTACT.email}
                  </a>
                </li>
              ) : null}
              {CONTACT.phone ? (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a href={`tel:${CONTACT.phone}`} className={linkClass}>
                    {CONTACT.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
