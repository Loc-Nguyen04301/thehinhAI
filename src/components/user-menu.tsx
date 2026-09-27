"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { hasPermission, parseRoles, ROLE_LABELS } from "@/lib/permissions";

// Rendered on the client so public pages (home, blog) can stay static.
export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDetailsElement>(null);

  if (isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-card" aria-hidden="true" />;
  }

  if (!session) {
    const next = pathname === "/login" || pathname === "/register" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return (
      <Link
        href={`/login${next}`}
        className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-brand-light"
      >
        Đăng nhập
      </Link>
    );
  }

  const { user } = session;
  const closeMenu = () => menuRef.current?.removeAttribute("open");

  async function handleSignOut() {
    closeMenu();
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <details ref={menuRef} className="relative">
      <summary
        aria-label="Tài khoản"
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-brand/15 font-bold text-brand hover:bg-brand/25 [&::-webkit-details-marker]:hidden"
      >
        {(user.name || user.email).charAt(0).toUpperCase()}
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-64 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-xl">
        <div className="px-3 py-2">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-brand">
            {parseRoles(user.role).map((role) => ROLE_LABELS[role]).join(", ")}
          </p>
        </div>
        {hasPermission(user.role, { user: ["list"] }) && (
          <Link
            href="/admin/users"
            onClick={closeMenu}
            className="block rounded-xl px-3 py-2 text-sm hover:bg-background"
          >
            Trang quản trị
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-background"
        >
          Đăng xuất
        </button>
      </div>
    </details>
  );
}
