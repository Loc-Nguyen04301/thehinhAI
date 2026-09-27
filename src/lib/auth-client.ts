import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "@/lib/auth";
import { ac, roles } from "@/lib/permissions";

// Browser-side auth: sign in/up/out and the useSession() hook. Talks to /api/auth/*.
export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles }), inferAdditionalFields<Auth>()],
});
