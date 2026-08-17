"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { logoutAction } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";
import logoMapImage from "../../public/logo-map.png";

const NAV_LINKS = [
  { href: "/overview", label: "Overview", Icon: LayoutDashboard },
  { href: "/forecast", label: "Disease Forecast", Icon: LineChart },
];

export function AppSidebar({ fullName }: { fullName: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out md:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border",
            collapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {!collapsed && (
            <Link href="/overview">
              <Logo />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {collapsed && (
          <Link href="/overview" className="flex justify-center py-3">
            <Image src={logoMapImage} alt="DawAI" width={28} height={28} />
          </Link>
        )}

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="truncate px-2 py-1 text-sm text-muted-foreground">{fullName}</div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              title={collapsed ? "Log out" : undefined}
              className={cn(
                "mt-1 flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Log out"}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-sidebar/95 px-4 backdrop-blur md:hidden">
        <Link href="/overview">
          <Logo size={36} />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 border-t border-border bg-sidebar/95 px-4 py-2 backdrop-blur md:hidden">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
