"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register";

// Better Auth error codes → friendly Vietnamese messages
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email hoặc mật khẩu chưa đúng.",
  INVALID_EMAIL: "Email chưa hợp lệ.",
  USER_ALREADY_EXISTS: "Email này đã được đăng ký. Bạn đăng nhập hoặc dùng email khác nhé.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Email này đã được đăng ký. Bạn đăng nhập hoặc dùng email khác nhé.",
  PASSWORD_TOO_SHORT: "Mật khẩu cần ít nhất 8 ký tự.",
  PASSWORD_TOO_LONG: "Mật khẩu quá dài.",
};

function toMessage(error: { code?: string; message?: string; status?: number }): string {
  if (error.code === "BANNED_USER" && error.message) return error.message;
  if (error.status === 429) return "Bạn thử quá nhiều lần, đợi một lát rồi thử lại nhé.";
  return (error.code && ERROR_MESSAGES[error.code]) || "Có lỗi xảy ra, bạn thử lại nhé.";
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand";

export function AuthForm({
  mode,
  next,
  googleEnabled,
  initialError,
}: {
  mode: Mode;
  next: string;
  googleEnabled: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setLoading(true);
    setError(null);
    const { error } =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            name: String(data.get("name") ?? "").trim(),
            email,
            password,
          });

    if (error) {
      setError(toMessage(error));
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: `/login?error=google&next=${encodeURIComponent(next)}`,
    });
    // On success the browser is redirected to Google, so we only get here on failure.
    if (error) {
      setError(toMessage(error));
      setLoading(false);
    }
  }

  const otherHref = `${mode === "login" ? "/register" : "/login"}?next=${encodeURIComponent(next)}`;

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-extrabold">
          {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </h1>
        <p className="text-muted">
          {mode === "login"
            ? "Chào mừng bạn quay lại! Tiếp tục hành trình tập luyện nhé."
            : "Lưu nhật ký tập và dùng AI đo kcal miễn phí."}
        </p>
      </header>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border py-3 font-semibold transition-colors hover:border-brand disabled:opacity-50"
          >
            <GoogleIcon />
            Tiếp tục với Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            hoặc dùng email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <label className="block space-y-1">
            <span className="text-sm text-muted">Tên của bạn</span>
            <input name="name" autoComplete="name" required maxLength={60} className={inputClass} />
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-sm text-muted">Email</span>
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Mật khẩu</span>
          <input
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
            className={inputClass}
          />
          {mode === "register" && <span className="text-xs text-muted">Ít nhất 8 ký tự.</span>}
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-3 font-semibold text-background transition-colors hover:bg-brand-light active:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <Link href={otherHref} className="font-semibold text-brand hover:text-brand-light">
          {mode === "login" ? "Đăng ký" : "Đăng nhập"}
        </Link>
      </p>
    </div>
  );
}

// Google's official logo colors (a third-party brand asset, so not theme tokens)
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
