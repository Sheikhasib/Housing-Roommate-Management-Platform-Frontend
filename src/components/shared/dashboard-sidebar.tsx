"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { isNavItemActive, type NavItem } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  items: readonly NavItem[];
  /** Neutral chip under the wordmark, for example "Owner". */
  roleLabel: string | null;
  /** Icon-only mode (desktop only). */
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function DashboardSidebar({
  items,
  roleLabel,
  collapsed = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={`${APP_NAME}, go to the home page`}
          className="flex min-w-0 items-center gap-2 rounded-lg text-base font-semibold text-sidebar-foreground outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" aria-hidden />
          </span>
          {collapsed ? null : <span className="truncate">{APP_NAME}</span>}
        </Link>
      </div>

      {roleLabel && !collapsed ? (
        <div className="px-4 pt-4">
          <span className="inline-flex items-center rounded-full bg-neutral-bg px-2.5 py-0.5 text-xs font-medium text-neutral">
            {roleLabel}
          </span>
        </div>
      ) : null}

      <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
            </Link>
          );

          if (!collapsed) return <div key={item.href}>{link}</div>;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </>
  );
}
