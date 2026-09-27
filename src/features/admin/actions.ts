"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { ROLE_IDS, type Role } from "@/lib/permissions";

// Thin wrappers over Better Auth's admin API. Permission checks happen inside Better Auth
// (role → permissions) and in the auth.ts hook (who may act on whom), so they also
// apply to anyone calling /api/auth/admin/* directly.

export type AdminActionState = { ok: boolean; message: string } | null;

const ERROR_MESSAGES: Record<string, string> = {
  YOU_CANNOT_BAN_YOURSELF: "Bạn không thể tự khoá tài khoản của mình.",
  YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE: "Role không hợp lệ.",
  USER_NOT_FOUND: "Không tìm thấy người dùng.",
};

async function run(action: () => Promise<unknown>, success: string): Promise<AdminActionState> {
  try {
    await action();
  } catch (error) {
    if (error instanceof APIError) {
      const code = typeof error.body?.code === "string" ? error.body.code : "";
      if (ERROR_MESSAGES[code]) return { ok: false, message: ERROR_MESSAGES[code] };
      if (error.status === "FORBIDDEN") {
        return { ok: false, message: "Bạn không có quyền thao tác với tài khoản này." };
      }
      if (error.status === "UNAUTHORIZED") {
        return { ok: false, message: "Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé." };
      }
    }
    console.error("[admin]", error);
    return { ok: false, message: "Có lỗi xảy ra, bạn thử lại nhé." };
  }
  refresh();
  return { ok: true, message: success };
}

export async function setRoleAction(
  userId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const role = formData.get("role");
  if (typeof role !== "string" || !ROLE_IDS.includes(role as Role)) {
    return { ok: false, message: "Role không hợp lệ." };
  }
  return run(
    async () =>
      getAuth().api.setRole({ body: { userId, role: role as Role }, headers: await headers() }),
    "Đã cập nhật role.",
  );
}

/** Ban or unban (form field `intent`), so one form state keeps the feedback across both. */
export async function updateBanAction(
  userId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (formData.get("intent") === "unban") {
    return run(
      async () => getAuth().api.unbanUser({ body: { userId }, headers: await headers() }),
      "Đã mở khoá tài khoản.",
    );
  }
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200);
  return run(
    async () =>
      getAuth().api.banUser({
        body: { userId, banReason: reason || undefined },
        headers: await headers(),
      }),
    "Đã khoá tài khoản và đăng xuất người dùng khỏi mọi thiết bị.",
  );
}
