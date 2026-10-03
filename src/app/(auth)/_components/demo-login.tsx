"use client";

import { Briefcase, Building2, Crown, Loader2, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Role } from "@/validation/enums";

interface DemoAccount {
  role: Role;
  name: string;
  description: string;
  icon: LucideIcon;
  email: string;
}

/** Emails only. The passwords stay in server env and are read by demoLoginAction. */
const MAIN_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    name: "Admin",
    description: "Review users and verifications",
    icon: ShieldCheck,
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "",
  },
  {
    role: "OWNER",
    name: "Owner",
    description: "Manage properties and rooms",
    icon: Building2,
    email: process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL ?? "",
  },
  {
    role: "TENANT",
    name: "Tenant",
    description: "Find a room and pay rent",
    icon: UserRound,
    email: process.env.NEXT_PUBLIC_DEMO_TENANT_EMAIL ?? "",
  },
];

const MORE_ACCOUNTS: DemoAccount[] = [
  {
    role: "PROPERTY_MANAGER",
    name: "Property manager",
    description: "Run day-to-day property tasks",
    icon: Briefcase,
    email: process.env.NEXT_PUBLIC_DEMO_MANAGER_EMAIL ?? "",
  },
  {
    role: "SUPER_ADMIN",
    name: "Super admin",
    description: "Admin tools and role management",
    icon: Crown,
    email: process.env.NEXT_PUBLIC_DEMO_SUPER_ADMIN_EMAIL ?? "",
  },
];

interface DemoLoginProps {
  pendingRole: Role | null;
  disabled: boolean;
  onSelect: (role: Role, email: string) => void;
}

function DemoCard({
  account,
  pendingRole,
  disabled,
  onSelect,
}: DemoLoginProps & { account: DemoAccount }) {
  const Icon = account.icon;
  const pending = pendingRole === account.role;

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2 sm:flex-col sm:items-start">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{account.name}</p>
          <p className="text-xs text-muted-foreground">{account.description}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-auto h-10 w-full"
        disabled={disabled}
        onClick={() => onSelect(account.role, account.email)}
        aria-label={`Demo Login as ${account.name}`}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Signing in" : "Demo Login"}
      </Button>
    </div>
  );
}

export function DemoLogin(props: DemoLoginProps) {
  return (
    <section aria-labelledby="demo-login-heading" className="space-y-3">
      <h2 id="demo-login-heading" className="text-center text-sm font-semibold text-foreground">
        Quick demo login
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {MAIN_ACCOUNTS.map((account) => (
          <DemoCard key={account.role} account={account} {...props} />
        ))}
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="more" className="border-b-0">
          <AccordionTrigger className="justify-center gap-1 py-2 text-xs text-muted-foreground hover:no-underline">
            More demo accounts
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {MORE_ACCOUNTS.map((account) => (
                <DemoCard key={account.role} account={account} {...props} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
