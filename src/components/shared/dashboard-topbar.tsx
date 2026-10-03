"use client";

import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import { getPageTitle, type NavItem } from "@/lib/nav-config";

interface DashboardTopbarProps {
  items: readonly NavItem[];
  collapsed: boolean;
  onOpenMobileNav: () => void;
  onToggleCollapsed: () => void;
}

export function DashboardTopbar({
  items,
  collapsed,
  onOpenMobileNav,
  onToggleCollapsed,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={onOpenMobileNav}
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <CollapseIcon className="size-5" aria-hidden />
      </Button>

      <p className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
        {getPageTitle(items, pathname)}
      </p>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu context="dashboard" />
      </div>
    </header>
  );
}
