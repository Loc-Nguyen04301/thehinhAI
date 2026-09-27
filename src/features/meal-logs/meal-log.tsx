import { requireUser } from "@/lib/session";
import { MealLogClient } from "./meal-log-client";
import { listMealLogs } from "./repository";
import { DateRangeSchema, type MealLogEntry } from "./types";

/** Caps the payload of a long range; the UI warns that totals may be incomplete. */
const MAX_RANGE_ENTRIES = 3000;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Loads the signed-in user's kcal log on the server, then hands it to the interactive UI.
 * `?from=&to=` picks the history range; without it the client shows the last 7 days
 * (only the browser knows the user's "today").
 */
export async function MealLog({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/meals");
  const parsed = DateRangeSchema.safeParse({ from: searchParams.from, to: searchParams.to });
  const range = parsed.success ? parsed.data : null; // invalid range → default view

  // Recent entries cover "today" and the default 7 days; the range query covers older days.
  const [recent, inRange] = await Promise.all([
    listMealLogs(user.id),
    range ? listMealLogs(user.id, { range, limit: MAX_RANGE_ENTRIES + 1 }) : [],
  ]);
  const truncated = inRange.length > MAX_RANGE_ENTRIES;

  return (
    <MealLogClient
      entries={mergeNewestFirst(recent, inRange.slice(0, MAX_RANGE_ENTRIES))}
      range={range}
      truncated={truncated}
    />
  );
}

/** Union of both lists without duplicates, newest day first (same order as the queries). */
function mergeNewestFirst(a: MealLogEntry[], b: MealLogEntry[]): MealLogEntry[] {
  const byId = new Map([...a, ...b].map((entry) => [entry.id, entry]));
  return [...byId.values()].sort(
    (x, y) => y.date.localeCompare(x.date) || y.createdAt - x.createdAt,
  );
}
