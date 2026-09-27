import { loadRecentAndRange, parseDateRange } from "@/lib/date-range";
import { requireUser } from "@/lib/session";
import { MealLogClient } from "./meal-log-client";
import { listMealLogs } from "./repository";

/**
 * Loads the signed-in user's kcal log on the server, then hands it to the interactive UI.
 * `?from=&to=` picks the history range; without it the client shows the last 7 days
 * (only the browser knows the user's "today").
 */
export async function MealLog({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser("/meal-logs");
  const range = parseDateRange(searchParams);
  const { entries, truncated } = await loadRecentAndRange(
    (options) => listMealLogs(user.id, options),
    range,
  );
  return <MealLogClient entries={entries} range={range} truncated={truncated} />;
}
