import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { requirePermission } from "@/lib/session";
import { RoleBadges, StatusBadge, formatDateTime } from "./badges";

const PAGE_SIZE = 20;

export async function UsersList({ query, page }: { query: string; page: number }) {
  await requirePermission({ user: ["list"] });

  const { users, total } = await getAuth().api.listUsers({
    query: {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      sortBy: "createdAt",
      sortDirection: "desc",
      ...(query ? { searchValue: query, searchField: "email", searchOperator: "contains" } : {}),
    },
    headers: await headers(),
  });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    `/admin/users?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Tìm theo email…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand"
        />
        <button className="shrink-0 rounded-xl bg-brand px-4 font-semibold text-background hover:bg-brand-light">
          Tìm
        </button>
      </form>

      <p className="text-sm text-muted">{total} người dùng</p>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {users.map((user) => (
          <li key={user.id}>
            <Link href={`/admin/users/${user.id}`} className="block space-y-1 p-4 hover:bg-background">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold">{user.name}</p>
                <StatusBadge banned={Boolean(user.banned)} />
              </div>
              <p className="truncate text-sm text-muted">{user.email}</p>
              <div className="flex items-center justify-between gap-2">
                <RoleBadges role={user.role} />
                <span className="text-xs text-muted">{formatDateTime(user.createdAt)}</span>
              </div>
            </Link>
          </li>
        ))}
        {users.length === 0 && <li className="p-6 text-center text-muted">Không tìm thấy ai.</li>}
      </ul>

      {pageCount > 1 && (
        <nav className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="text-brand">← Trước</Link> : <span />}
          <span className="text-muted">
            Trang {page}/{pageCount}
          </span>
          {page < pageCount ? <Link href={pageHref(page + 1)} className="text-brand">Sau →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
