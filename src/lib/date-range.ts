import { z } from "zod";

// History filter shared by the logs (workouts, meal logs): `?from=YYYY-MM-DD&to=YYYY-MM-DD`.
// Safe on server and client. The picker UI is components/date-range-filter.tsx.

/** Longest range the user can pick (inclusive days). */
export const MAX_RANGE_DAYS = 366;
/** Without `from`/`to`, history shows this many days ending today (computed on the client). */
export const DEFAULT_RANGE_DAYS = 7;
/** Caps the payload of a long range; the UI warns that totals may be incomplete. */
export const MAX_RANGE_ENTRIES = 3000;

/** Days since the epoch in UTC, so DST can't shift the count. */
function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Both days included. */
export const DateRangeSchema = z
  .object({
    from: z.iso.date("Bạn chọn ngày bắt đầu nhé"),
    to: z.iso.date("Bạn chọn ngày kết thúc nhé"),
  })
  .refine((range) => range.from <= range.to, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc")
  .refine(
    (range) => dayNumber(range.to) - dayNumber(range.from) + 1 <= MAX_RANGE_DAYS,
    `Bạn chọn khoảng tối đa ${MAX_RANGE_DAYS} ngày nhé`,
  );

export type DateRange = z.infer<typeof DateRangeSchema>;

type SearchParams = Record<string, string | string[] | undefined>;

/** The page's `?from=&to=`, or null when missing or invalid (→ default view). */
export function parseDateRange(searchParams: SearchParams): DateRange | null {
  const parsed = DateRangeSchema.safeParse({ from: searchParams.from, to: searchParams.to });
  return parsed.success ? parsed.data : null;
}

type DatedEntry = { id: string; date: string; createdAt: number };
type ListOptions = { range?: DateRange; limit?: number };

/**
 * Loads what a log page needs: the latest entries (they cover "today" and the default
 * last-7-days view) plus, when a range is picked, every entry in it (older days included).
 * `list` is the feature's repository query, already scoped to the signed-in user.
 */
export async function loadRecentAndRange<T extends DatedEntry>(
  list: (options: ListOptions) => Promise<T[]>,
  range: DateRange | null,
): Promise<{ entries: T[]; truncated: boolean }> {
  const [recent, inRange] = await Promise.all([
    list({}),
    range ? list({ range, limit: MAX_RANGE_ENTRIES + 1 }) : Promise.resolve([]),
  ]);
  // Union without duplicates, newest day first (same order as the queries)
  const byId = new Map([...recent, ...inRange.slice(0, MAX_RANGE_ENTRIES)].map((e) => [e.id, e]));
  const entries = [...byId.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );
  return { entries, truncated: inRange.length > MAX_RANGE_ENTRIES };
}
