import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import type { MongoClient } from "mongodb";
import { getDb, getMongoClient } from "@/lib/db";
import { ac, canManageUser, DEFAULT_ROLE, roles } from "@/lib/permissions";
import { siteConfig } from "@/lib/site";

// Admin endpoints that act on another user via `body.userId`. The admin plugin only checks
// the caller's permission, not who the target is — the hook below adds that rule.
const TARGETED_ADMIN_PATHS = new Set([
  "/admin/set-role",
  "/admin/ban-user",
  "/admin/unban-user",
  "/admin/list-user-sessions",
  "/admin/revoke-user-sessions",
  "/admin/set-user-password",
  "/admin/update-user",
  "/admin/remove-user",
  "/admin/impersonate-user",
]);

/**
 * Origins allowed to call the auth API besides BETTER_AUTH_URL's: BETTER_AUTH_TRUSTED_ORIGINS,
 * plus on Vercel this app's own URLs (Vercel system env vars, host only): the unique URL of
 * each deployment, the git branch URL and the production domain. Without them, opening a
 * deployment URL fails with INVALID_ORIGIN. Never trust all of *.vercel.app (other people's apps).
 */
function trustedOrigins(): string[] {
  const configured = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [];
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((host): host is string => Boolean(host));
  return [...configured, ...vercelHosts.map((host) => `https://${host}`)]
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Google sign-in is offered only when its OAuth credentials are configured. */
export function isGoogleEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

function createAuth() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    appName: siteConfig.name,
    // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment.
    database: mongodbAdapter(getDb(), { client: getMongoClient() }),
    trustedOrigins: trustedOrigins(),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
              prompt: "select_account",
            },
          }
        : {},
    account: {
      // Signing in with Google using an email that already has a password account links both.
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    plugins: [
      admin({
        ac,
        roles,
        defaultRole: DEFAULT_ROLE,
        adminRoles: ["admin"],
        bannedUserMessage:
          "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ bộ phận hỗ trợ nếu cần giúp đỡ.",
      }),
      nextCookies(), // must stay last
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!TARGETED_ADMIN_PATHS.has(ctx.path)) return;
        const targetId: unknown = ctx.body?.userId;
        if (typeof targetId !== "string") return;
        const session = await getAuthoritativeSessionFromCtx(ctx);
        if (!session) return; // the endpoint itself answers 401
        const target = await ctx.context.internalAdapter.findUserById(targetId);
        if (!target) return; // the endpoint itself answers 404
        const actor = {
          id: session.user.id,
          role: session.user.role as string | undefined,
        };
        const targetUser = {
          id: target.id,
          role: (target as { role?: string }).role,
        };
        if (!canManageUser(actor, targetUser)) {
          throw new APIError("FORBIDDEN", {
            message: "Bạn không có quyền thao tác với tài khoản này.",
          });
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: { auth: Auth; client: MongoClient } | undefined;

/**
 * Created lazily so `next build` doesn't need MONGODB_URI / BETTER_AUTH_SECRET.
 * Rebuilt when lib/db replaced a closed MongoClient (the old instance holds the dead one).
 */
export function getAuth(): Auth {
  const client = getMongoClient();
  if (instance?.client !== client) instance = { auth: createAuth(), client };
  return instance.auth;
}
