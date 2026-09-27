import { parseRoles, ROLE_LABELS } from "@/lib/permissions";

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function formatDateTime(date: Date | string): string {
  return dateTimeFormat.format(new Date(date));
}

export function RoleBadges({ role }: { role?: string | null }) {
  return (
    <span className="flex flex-wrap gap-1">
      {parseRoles(role).map((r) => (
        <span
          key={r}
          className={`rounded-full px-2 py-0.5 text-xs ${
            r === "user" ? "bg-background text-muted" : "bg-brand/15 text-brand"
          }`}
        >
          {ROLE_LABELS[r]}
        </span>
      ))}
    </span>
  );
}

export function StatusBadge({ banned }: { banned: boolean }) {
  if (!banned) return null;
  return (
    <span className="shrink-0 rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">
      Đã khoá
    </span>
  );
}
