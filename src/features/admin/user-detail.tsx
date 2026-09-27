import { APIError } from "better-auth/api";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { countWorkouts, listWorkouts } from "@/features/workouts/repository";
import { WorkoutHistoryReadOnly } from "@/features/workouts/workout-log-client";
import { getAuth } from "@/lib/auth";
import { canManageUser, hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { RoleBadges, StatusBadge, formatDateTime } from "./badges";
import { BanForm, RoleForm } from "./user-actions";

async function findUser(id: string) {
  try {
    return await getAuth().api.getUser({ query: { id }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError && error.status === "NOT_FOUND") return null;
    throw error;
  }
}

export async function UserDetail({ id }: { id: string }) {
  const actor = await requirePermission({ user: ["get"] });
  const user = await findUser(id);
  if (!user) notFound();

  const manageable = canManageUser(actor, user);
  const canSetRole = manageable && hasPermission(actor.role, { user: ["set-role"] });
  const canBan = manageable && hasPermission(actor.role, { user: ["ban"] });
  const canViewWorkouts = hasPermission(actor.role, { workout: ["view-any"] });
  const [workouts, workoutCount] = canViewWorkouts
    ? await Promise.all([listWorkouts(user.id, 50), countWorkouts(user.id)])
    : [[], 0];

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-muted hover:text-brand">
        ← Danh sách người dùng
      </Link>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{user.name}</h2>
            <p className="truncate text-muted">{user.email}</p>
          </div>
          <StatusBadge banned={Boolean(user.banned)} />
        </div>
        <RoleBadges role={user.role} />
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted">Ngày tạo</dt>
          <dd>{formatDateTime(user.createdAt)}</dd>
          <dt className="text-muted">Email đã xác minh</dt>
          <dd>{user.emailVerified ? "Có" : "Chưa"}</dd>
          {canViewWorkouts && (
            <>
              <dt className="text-muted">Số bài tập đã ghi</dt>
              <dd>{workoutCount}</dd>
            </>
          )}
          {user.banned && (
            <>
              <dt className="text-muted">Lý do khoá</dt>
              <dd>{user.banReason || "—"}</dd>
            </>
          )}
        </dl>
      </section>

      {(canSetRole || canBan) && (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
          <h2 className="font-bold">Thao tác</h2>
          {canSetRole && <RoleForm userId={user.id} role={user.role} />}
          {canBan && <BanForm userId={user.id} banned={Boolean(user.banned)} />}
        </section>
      )}
      {!manageable && (
        <p className="text-sm text-muted">
          {actor.id === user.id
            ? "Đây là tài khoản của bạn. Bạn không thể tự đổi role hay khoá tài khoản của mình."
            : "Chỉ quản trị viên mới được thao tác với tài khoản nhân sự."}
        </p>
      )}

      {canViewWorkouts && (
        <section className="space-y-3">
          <h2 className="font-bold">Nhật ký tập gần đây (chỉ xem)</h2>
          <WorkoutHistoryReadOnly entries={workouts} />
        </section>
      )}
    </div>
  );
}
