"use client";

import { useActionState } from "react";
import { ROLE_IDS, ROLE_LABELS, parseRoles } from "@/lib/permissions";
import { setRoleAction, updateBanAction, type AdminActionState } from "./actions";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand";

function Feedback({ state }: { state: AdminActionState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? "text-brand" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

export function RoleForm({ userId, role }: { userId: string; role?: string | null }) {
  const [state, formAction, pending] = useActionState(setRoleAction.bind(null, userId), null);

  return (
    <form action={formAction} className="space-y-2">
      <label className="block space-y-1">
        <span className="text-sm text-muted">Role</span>
        <div className="flex gap-2">
          <select name="role" defaultValue={parseRoles(role)[0]} className={inputClass}>
            {ROLE_IDS.map((id) => (
              <option key={id} value={id}>
                {ROLE_LABELS[id]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-xl bg-brand px-4 font-semibold text-background hover:bg-brand-light disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </label>
      <Feedback state={state} />
    </form>
  );
}

export function BanForm({ userId, banned }: { userId: string; banned: boolean }) {
  const [state, formAction, pending] = useActionState(updateBanAction.bind(null, userId), null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!banned && !confirm("Khoá tài khoản này? Người dùng sẽ bị đăng xuất khỏi mọi thiết bị.")) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="intent" value={banned ? "unban" : "ban"} />
      {banned ? (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl border border-border py-2.5 font-semibold hover:border-brand hover:text-brand disabled:opacity-50"
        >
          Mở khoá tài khoản
        </button>
      ) : (
        <>
          <label className="block space-y-1">
            <span className="text-sm text-muted">Lý do khoá (không bắt buộc)</span>
            <input name="reason" maxLength={200} placeholder="VD: spam, vi phạm điều khoản" className={inputClass} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl border border-danger/50 py-2.5 font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Khoá tài khoản
          </button>
        </>
      )}
      <Feedback state={state} />
    </form>
  );
}
