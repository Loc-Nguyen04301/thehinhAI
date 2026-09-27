import Link from "next/link";
import { DesktopNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { siteConfig } from "@/lib/site";

/** Brand name as text: "thehinh" in the text color + "AI" in brand blue, bold italic. */
export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-extrabold italic tracking-tight ${className}`}>
      thehinh<span className="text-brand">AI</span>
    </span>
  );
}

// Three zones: wordmark left, feature menu centered, theme toggle + account right.
// Equal 1fr side columns keep the menu truly centered whatever their widths.
// Wider than the page content (max-w-3xl) so the sides sit near the screen edges.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        <Link href="/" aria-label={`${siteConfig.name} — Trang chủ`} className="justify-self-start">
          <Wordmark />
        </Link>
        {/* Hidden on mobile (bottom tab bar instead); the right zone is pinned to column 3 */}
        <DesktopNav />
        <div className="col-start-3 flex items-center gap-2 justify-self-end">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
