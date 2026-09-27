"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDays, formatShortDay } from "@/lib/date";
import { DEFAULT_RANGE_DAYS, DateRangeSchema, type DateRange } from "@/lib/date-range";

// "Từ ngày – Đến ngày" history filter shared by the logs. The range lives in the URL
// (?from=&to=) so the server can load older days; see lib/date-range.ts.

/** The range on screen: the URL's, or the last DEFAULT_RANGE_DAYS days ending `today`. */
export function shownRange(range: DateRange | null, today: string): DateRange {
  return range ?? { from: addDays(today, 1 - DEFAULT_RANGE_DAYS), to: today };
}

export function isInRange(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

/** "7 ngày gần nhất" / "21/09/2026" / "01/09/2026 – 27/09/2026" */
export function rangeLabel(range: DateRange | null): string {
  if (!range) return `${DEFAULT_RANGE_DAYS} ngày gần nhất`;
  return range.from === range.to
    ? formatShortDay(range.from)
    : `${formatShortDay(range.from)} – ${formatShortDay(range.to)}`;
}

/**
 * Changes the URL's range (null = back to the default). Inside a transition,
 * `loading` stays true until the page has re-rendered with the new data.
 */
export function useRangeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, startTransition] = useTransition();

  function showRange(next: DateRange | null) {
    const url = next ? `${pathname}?${new URLSearchParams(next)}` : pathname;
    startTransition(() => router.push(url, { scroll: false }));
  }

  return { loading, showRange };
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-brand";

/** Card with the range picker on top and the feature's totals (`children`) below. */
export function DateRangeFilter({
  today,
  range,
  loading,
  onChange,
  children,
}: {
  today: string;
  /** From the URL; null = default last days. */
  range: DateRange | null;
  loading: boolean;
  onChange: (range: DateRange | null) => void;
  children: React.ReactNode;
}) {
  const shown = shownRange(range, today);
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-6">
      <RangeForm
        key={`${shown.from}_${shown.to}`} // reset the inputs when the URL changes (back button)
        today={today}
        initial={shown}
        loading={loading}
        onApply={onChange}
        onReset={range ? () => onChange(null) : undefined}
      />
      <div
        aria-live="polite"
        aria-busy={loading}
        className={`border-t border-border pt-4 transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

function RangeForm({
  today,
  initial,
  loading,
  onApply,
  onReset,
}: {
  today: string;
  initial: DateRange;
  loading: boolean;
  onApply: (range: DateRange) => void;
  onReset?: () => void;
}) {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = DateRangeSchema.safeParse({ from, to });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Khoảng ngày chưa hợp lệ.");
      return;
    }
    setError(null);
    onApply(parsed.data);
  }

  return (
    // noValidate: show our Vietnamese messages; min/max still grey out days in the picker
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Từ ngày</span>
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Đến ngày</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl border border-brand py-2.5 font-semibold text-brand transition-colors hover:bg-brand/10 disabled:opacity-60"
        >
          {loading ? "Đang tải…" : "Xem"}
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="shrink-0 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-brand disabled:opacity-60"
          >
            {DEFAULT_RANGE_DAYS} ngày gần nhất
          </button>
        )}
      </div>
    </form>
  );
}

/** Shown under the card when a long range was cut to MAX_RANGE_ENTRIES. */
export function TruncatedRangeNote() {
  return (
    <p className="text-sm text-muted">
      Khoảng này có quá nhiều mục nên chỉ hiện một phần, số tổng có thể bị thiếu. Bạn chọn khoảng
      ngắn hơn nhé.
    </p>
  );
}
