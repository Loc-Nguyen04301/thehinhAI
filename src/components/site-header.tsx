import Link from "next/link";
import { DesktopNav } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { siteConfig } from "@/lib/site";

/** Brand name as text: "thehinh" in white + "AI" in brand blue, bold italic. */
export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-extrabold italic tracking-tight ${className}`}>
      thehinh<span className="text-brand">AI</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label={`${siteConfig.name} — Trang chủ`}>
          <Wordmark />
        </Link>
        <div className="flex items-center gap-3">
          <DesktopNav />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
