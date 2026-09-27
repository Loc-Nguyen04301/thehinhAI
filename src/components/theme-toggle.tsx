"use client";

import { setTheme } from "@/lib/theme";

// The icon is picked by CSS (`dark:`), so the server-rendered HTML is already correct
// and nothing flickers during hydration.
export function ThemeToggle() {
  function toggle() {
    setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Chuyển giao diện sáng/tối"
      title="Chuyển giao diện sáng/tối"
      className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card hover:text-foreground"
    >
      {/* Dark theme → sun (switch to light) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        aria-hidden="true"
        className="hidden size-5 dark:block"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Light theme → moon (switch to dark) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5 dark:hidden"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
