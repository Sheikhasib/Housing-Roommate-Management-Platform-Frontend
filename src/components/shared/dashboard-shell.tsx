"use client";

import { useState, type ReactNode } from "react";

import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { DashboardTopbar } from "@/components/shared/dashboard-topbar";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useSession } from "@/hooks/useSession";
import { AREA_LABELS, getNavItems } from "@/lib/nav-config";
import { AREA_HOME, ROLE_AREA, ROLE_LABELS, type Area } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  /** Fixed by the area layout. Omit for pages shared by every role: the session role decides. */
  area?: Area;
  children: ReactNode;
}

export function DashboardShell({ area, children }: DashboardShellProps) {
  const { role } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const resolvedArea = area ?? (role ? ROLE_AREA[role] : null);
  const items = resolvedArea ? getNavItems(resolvedArea, role) : [];
  const homeHref = resolvedArea ? AREA_HOME[resolvedArea] : "/";
  const roleLabel = role ? ROLE_LABELS[role] : resolvedArea ? AREA_LABELS[resolvedArea] : null;

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
          collapsed ? "w-18" : "w-66",
        )}
      >
        <DashboardSidebar
          items={items}
          homeHref={homeHref}
          roleLabel={roleLabel}
          collapsed={collapsed}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-66"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Pages in your dashboard</SheetDescription>
          <DashboardSidebar
            items={items}
            homeHref={homeHref}
            roleLabel={roleLabel}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          items={items}
          collapsed={collapsed}
          onOpenMobileNav={() => setMobileOpen(true)}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
        />
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
