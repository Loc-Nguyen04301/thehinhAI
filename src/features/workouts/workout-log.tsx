import { requireUser } from "@/lib/session";
import { listWorkouts } from "./repository";
import { WorkoutLogClient } from "./workout-log-client";

/** Loads the signed-in user's workouts on the server, then hands them to the interactive UI. */
export async function WorkoutLog() {
  const user = await requireUser("/workouts");
  const entries = await listWorkouts(user.id);
  return <WorkoutLogClient entries={entries} />;
}
