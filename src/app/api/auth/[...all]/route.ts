import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// All Better Auth endpoints: /api/auth/sign-in/email, /api/auth/callback/google, /api/auth/admin/*…
// Resolved per request so the build doesn't need database credentials.
export function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
