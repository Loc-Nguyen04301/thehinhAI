import { loadRecentAndRange, parseDateRange } from "@/lib/date-range";
import { requireUser } from "@/lib/session";
import { listWorkouts } from "./repository";
import { WorkoutLogClient } from "./workout-log-client";

/**
 * Loads the signed-in user's workouts on the server, then hands them to the interactive UI.
 * `?from=&to=` picks the history range; without it the client shows the last 7 days
 * (only the browser knows the user's "today").
 */
export async function WorkoutLog({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser("/workouts");
  const range = parseDateRange(searchParams);
  const { entries, truncated } = await loadRecentAndRange(
    (options) => listWorkouts(user.id, options),
    range,
  );
  return <WorkoutLogClient entries={entries} range={range} truncated={truncated} />;
}
