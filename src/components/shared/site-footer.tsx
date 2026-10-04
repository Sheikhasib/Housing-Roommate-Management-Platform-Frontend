import Link from "next/link";
import { Building2, Clock, Mail, MapPin, Phone } from "lucide-react";

import { SocialIcon } from "@/components/shared/social-icons";
import { APP_NAME, APP_TAGLINE, CONTACT, SOCIAL_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

const socialClass =
  "inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground";

export function SiteFooter() {
  const hasContact = Boolean(CONTACT.email || CONTACT.phone || CONTACT.address || CONTACT.hours);

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
          <p className="max-w-xs text-sm text-muted-foreground">{APP_TAGLINE}</p>
          <ul className="flex flex-wrap gap-2">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                {social.href ? (
                  <a
                    href={social.href}
                    aria-label={social.name}
                    {...(social.href.startsWith("mailto:")
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    className={cn(
                      socialClass,
                      "transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                    )}
                  >
                    <SocialIcon name={social.name} />
                  </a>
                ) : (
                  <span role="img" aria-label={social.name} className={cn(socialClass, "cursor-default")}>
                    <SocialIcon name={social.name} />
                  </span>
                )}
              </li>
            ))}
          </ul>
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
                  <span>{CONTACT.phone}</span>
                </li>
              ) : null}
              {CONTACT.hours ? (
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{CONTACT.hours}</span>
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
