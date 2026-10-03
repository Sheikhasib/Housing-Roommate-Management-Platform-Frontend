"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Building2, LogOut, Menu, User } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useSession";
import { APP_NAME } from "@/lib/constants";
import { getProfileHref, getRoleHome } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

const PUBLIC_LINKS: readonly NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const links: readonly NavLink[] =
    isAuthenticated && user
      ? [
          ...PUBLIC_LINKS,
          { label: "Help", href: "/help" },
          { label: "Dashboard", href: getRoleHome(user.role) },
        ]
      : PUBLIC_LINKS;

  function renderLinks(onNavigate?: () => void, className?: string) {
    return links.map((link) => {
      const active = isActive(pathname, link.href);
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          {link.label}
        </Link>
      );
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" aria-hidden />
          </span>
          {APP_NAME}
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {renderLinks()}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {isLoading ? (
            <Skeleton className="h-10 w-28 rounded-lg" />
          ) : isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Notifications">
                <Link href="/notifications">
                  <Bell className="size-5" aria-hidden />
                </Link>
              </Button>
              <UserMenu context="site" />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="gap-0 p-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle>{APP_NAME}</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
                {renderLinks(() => setMenuOpen(false), "h-11")}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                {isAuthenticated && user ? (
                  <>
                    <Button asChild variant="outline" onClick={() => setMenuOpen(false)}>
                      <Link href={getProfileHref(user.role)}>
                        <User aria-hidden />
                        Profile
                      </Link>
                    </Button>
                    <Button asChild variant="outline" onClick={() => setMenuOpen(false)}>
                      <Link href="/notifications">
                        <Bell aria-hidden />
                        Notifications
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMenuOpen(false);
                        void logout();
                      }}
                    >
                      <LogOut aria-hidden />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" onClick={() => setMenuOpen(false)}>
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild onClick={() => setMenuOpen(false)}>
                      <Link href="/register">Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
