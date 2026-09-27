import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "@/lib/auth";
import { hasPermission, type Permissions } from "@/lib/permissions";

// Server-side auth checks. Call them in every page, Server Action and Route Handler that
// needs them — not only in layouts, which don't re-run on client-side navigation.

/** Current session (deduplicated per request), or null when signed out. */
export const getSession = cache(async () => {
  // Read headers first: it marks the route as dynamic before auth/DB are touched,
  // so `next build` never tries to reach the database while prerendering.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

/** For pages: redirects to /login (then back to `returnTo`) when signed out. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session.user;
}

/** For staff pages: 404 unless signed in with the given permissions. */
export async function requirePermission(permissions: Permissions): Promise<SessionUser> {
  const session = await getSession();
  if (!session || !hasPermission(session.user.role, permissions)) notFound();
  return session.user;
}

/** Only allows same-site paths as a redirect target (prevents open redirects). */
export function safeReturnPath(value: string | string[] | undefined, fallback = "/"): string {
  // "//evil.com" and "/\evil.com" are protocol-relative URLs to another site
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : fallback;
}
