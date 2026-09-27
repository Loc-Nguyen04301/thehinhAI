"use client";

// Shown when a page throws on the server (e.g. database unreachable).
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="text-xl font-bold">Ối, có lỗi xảy ra</h1>
      <p className="text-muted">Hệ thống đang gặp trục trặc tạm thời. Bạn thử lại sau ít phút nhé.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-background hover:bg-brand-light"
      >
        Thử lại
      </button>
    </div>
  );
}
