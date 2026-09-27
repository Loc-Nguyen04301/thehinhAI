import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { isGoogleEnabled } from "@/lib/auth";
import { getSession, safeReturnPath } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  const returnTo = safeReturnPath(next, "/workouts");
  if (await getSession()) redirect(returnTo);

  return (
    <AuthForm
      mode="login"
      next={returnTo}
      googleEnabled={isGoogleEnabled()}
      initialError={error ? "Đăng nhập bằng Google chưa thành công, bạn thử lại nhé." : undefined}
    />
  );
}
