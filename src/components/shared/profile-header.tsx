import { ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role, VerificationStatus } from "@/validation/enums";

interface ProfileHeaderProps {
  name: string;
  email: string;
  imageUrl: string | null;
  role: Role;
  /** Tenants and owners only; APPROVED shows the Verified badge. */
  verificationStatus?: VerificationStatus;
}

function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return letters.join("").toUpperCase() || "?";
}

export function ProfileHeader({ name, email, imageUrl, role, verificationStatus }: ProfileHeaderProps) {
  return (
    <Card className="flex-row items-center gap-4 px-4 sm:px-6">
      <Avatar className="size-16 sm:size-20">
        {imageUrl ? <AvatarImage src={imageUrl} alt={`Profile picture of ${name}`} /> : null}
        <AvatarFallback className="text-xl">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-1.5">
        <h2 className="truncate text-lg font-semibold text-foreground">{name}</h2>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{ROLE_LABELS[role]}</Badge>
          {verificationStatus === "APPROVED" ? (
            <Badge variant="success">
              <ShieldCheck aria-hidden="true" />
              Verified
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
