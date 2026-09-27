import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { getDb, toObjectId } from "@/lib/db";
import type { WorkoutEntry, WorkoutInput } from "./types";

// MongoDB access for workouts. Callers must pass the *signed-in* user's id —
// every query is scoped by userId so nobody can read or delete another user's data.

type WorkoutDoc = WorkoutInput & {
  _id: ObjectId;
  userId: ObjectId; // → user._id (same type as Better Auth's account/session.userId)
  createdAt: Date;
  updatedAt?: Date; // set when the entry is edited
};

let indexesReady: Promise<unknown> | undefined;

async function workouts(): Promise<Collection<WorkoutDoc>> {
  const collection = getDb().collection<WorkoutDoc>("workouts");
  indexesReady ??= collection
    .createIndex({ userId: 1, date: -1, createdAt: -1 })
    .catch((error) => {
      indexesReady = undefined; // retry on the next call
      throw error;
    });
  await indexesReady;
  return collection;
}

/** Better Auth user ids are ObjectId hex strings; anything else is a bug upstream. */
function userObjectId(userId: string): ObjectId {
  const id = toObjectId(userId);
  if (!id) throw new Error(`Invalid user id: ${userId}`);
  return id;
}

function toEntry(doc: WorkoutDoc): WorkoutEntry {
  return {
    id: doc._id.toHexString(),
    date: doc.date,
    exercise: doc.exercise,
    muscleGroup: doc.muscleGroup,
    sets: doc.sets.map((set) => ({ reps: set.reps, weightKg: set.weightKg })),
    ...(doc.note ? { note: doc.note } : {}),
    createdAt: doc.createdAt.getTime(),
  };
}

/** Newest first. */
export async function listWorkouts(userId: string, limit = 200): Promise<WorkoutEntry[]> {
  const docs = await (await workouts())
    .find({ userId: userObjectId(userId) })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toEntry);
}

export async function countWorkouts(userId: string): Promise<number> {
  return (await workouts()).countDocuments({ userId: userObjectId(userId) });
}

export async function insertWorkout(userId: string, input: WorkoutInput): Promise<WorkoutEntry> {
  const { note, ...rest } = input;
  const doc: WorkoutDoc = {
    _id: new ObjectId(),
    ...rest,
    ...(note ? { note } : {}),
    userId: userObjectId(userId),
    createdAt: new Date(),
  };
  await (await workouts()).insertOne(doc);
  return toEntry(doc);
}

/** Replaces the editable fields. Returns false when the entry doesn't exist or belongs to someone else. */
export async function updateWorkout(
  userId: string,
  id: string,
  input: WorkoutInput,
): Promise<boolean> {
  const workoutId = toObjectId(id);
  if (!workoutId) return false;
  const { note, ...rest } = input;
  const result = await (await workouts()).updateOne(
    { _id: workoutId, userId: userObjectId(userId) },
    {
      $set: { ...rest, ...(note ? { note } : {}), updatedAt: new Date() },
      ...(note ? {} : { $unset: { note: "" } }), // note cleared in the form
    },
  );
  return result.matchedCount === 1;
}

/** Returns false when the entry doesn't exist or belongs to someone else. */
export async function deleteWorkout(userId: string, id: string): Promise<boolean> {
  const workoutId = toObjectId(id);
  if (!workoutId) return false;
  const result = await (await workouts()).deleteOne({ _id: workoutId, userId: userObjectId(userId) });
  return result.deletedCount === 1;
}
