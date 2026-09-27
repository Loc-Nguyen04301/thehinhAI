import { useSyncExternalStore } from "react";

// Shared by feature logs (workouts, meal logs) that group entries by day and
// need to know "today" from the browser's timezone — the server can't know it.
// Import only from client components (useToday is a hook).

const noopSubscribe = () => () => {};
// "en-CA" formats as YYYY-MM-DD in the user's local timezone.
const localToday = () => new Date().toLocaleDateString("en-CA");

/** Today's date on the client; "" on the server, which can't know the user's timezone. */
export function useToday(): string {
  return useSyncExternalStore(noopSubscribe, localToday, () => "");
}

export const numberFormat = new Intl.NumberFormat("vi-VN");

const dayFormat = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const shortDayFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** YYYY-MM-DD → local midnight of that day. */
function parseDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** YYYY-MM-DD shifted by `days` (negative = earlier), still YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const day = parseDay(date);
  day.setDate(day.getDate() + days);
  return day.toLocaleDateString("en-CA");
}

/** "Hôm nay" / "Hôm qua" / full weekday date, given `today` from useToday(). */
export function formatDay(date: string, today: string): string {
  const diffDays = Math.round((parseDay(today).getTime() - parseDay(date).getTime()) / 86_400_000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return dayFormat.format(parseDay(date));
}

/** "21/09/2026" */
export function formatShortDay(date: string): string {
  return shortDayFormat.format(parseDay(date));
}

/** Entries grouped per day, newest day first; each day keeps the entries' order. */
export function groupByDate<T extends { date: string }>(entries: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}
