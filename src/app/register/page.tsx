import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { isGoogleEnabled } from "@/lib/auth";
import { getSession, safeReturnPath } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const { next } = await props.searchParams;
  const returnTo = safeReturnPath(next, "/workouts");
  if (await getSession()) redirect(returnTo);

  return <AuthForm mode="register" next={returnTo} googleEnabled={isGoogleEnabled()} />;
}
