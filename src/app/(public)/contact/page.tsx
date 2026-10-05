import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SocialLinks } from "@/components/shared/social-links";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, CONTACT } from "@/lib/constants";
import { ContactForm } from "./_components/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Send ${APP_NAME} a message or find our email, phone, address and opening hours.`,
};

const DETAILS = [
  { key: "address", label: "Address", icon: MapPin, value: CONTACT.address },
  { key: "email", label: "Email", icon: Mail, value: CONTACT.email },
  { key: "phone", label: "Phone", icon: Phone, value: CONTACT.phone },
  { key: "hours", label: "Hours", icon: Clock, value: CONTACT.hours },
].filter((item) => Boolean(item.value));

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <PageHeader
        title="Contact us"
        description="Questions about a room, verification or a payment? Send us a message and we will reply by email."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {DETAILS.length > 0 ? (
              <dl className="space-y-4">
                {DETAILS.map(({ key, label, icon: Icon, value }) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium break-words text-foreground">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Follow us</p>
              <SocialLinks />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
