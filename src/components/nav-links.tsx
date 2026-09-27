"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIconSvg } from "@/components/icons";
import { siteConfig } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {siteConfig.nav.slice(1).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isActive(pathname, item.href)
              ? "bg-card text-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Bottom tab bar: easy to reach with one thumb while at the gym.
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {siteConfig.nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <NavIconSvg name={item.icon} className="size-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
