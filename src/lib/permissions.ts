// Roles & permissions — shared by server (auth.ts, session.ts) and client (UI).
// To add a role: add it to `roles` and `ROLE_LABELS`. To add a permission:
// add the action to `statement`, grant it to roles, then check it with hasPermission().
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  // user: create, list, set-role, ban, impersonate, delete, set-password, get, update…
  // session: list, revoke, delete — from Better Auth's admin plugin
  ...defaultStatements,
  workout: ["view-any"], // read another user's workout log (support)
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  user: ac.newRole({ user: [], session: [], workout: [] }),
  // Customer support: look up users, lock/unlock regular accounts, read their logs.
  cs: ac.newRole({
    user: ["list", "get", "ban"],
    session: ["list", "revoke"],
    workout: ["view-any"],
  }),
  admin: ac.newRole({ ...adminAc.statements, workout: ["view-any"] }),
};

export type Role = keyof typeof roles;
export type Permissions = {
  [K in keyof typeof statement]?: (typeof statement)[K][number][];
};

export const DEFAULT_ROLE: Role = "user";
export const ROLE_IDS = Object.keys(roles) as Role[];
export const ROLE_LABELS: Record<Role, string> = {
  user: "Người dùng",
  cs: "Chăm sóc khách hàng",
  admin: "Quản trị viên",
};

function isRole(value: string): value is Role {
  return value in roles;
}

/** Better Auth stores multiple roles as a comma-separated string. */
export function parseRoles(role: string | null | undefined): Role[] {
  return (role || DEFAULT_ROLE)
    .split(",")
    .map((r) => r.trim())
    .filter(isRole);
}

export function hasPermission(role: string | null | undefined, permissions: Permissions): boolean {
  return parseRoles(role).some((r) => roles[r].authorize(permissions).success);
}

/** Staff = any role other than a plain user. */
export function isStaff(role: string | null | undefined): boolean {
  return parseRoles(role).some((r) => r !== "user");
}

/**
 * Whether `actor` may change `target` (role, ban, sessions…), on top of the permission check.
 * Nobody acts on their own account, and only admins act on staff accounts.
 */
export function canManageUser(
  actor: { id: string; role?: string | null },
  target: { id: string; role?: string | null },
): boolean {
  if (actor.id === target.id) return false;
  return !isStaff(target.role) || parseRoles(actor.role).includes("admin");
}
