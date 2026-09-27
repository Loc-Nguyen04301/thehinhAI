import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db";
import type { WorkoutEntry, WorkoutInput } from "./types";

// MongoDB access for workouts. Callers must pass the *signed-in* user's id —
// every query is scoped by userId so nobody can read or delete another user's data.

type WorkoutDoc = WorkoutInput & {
  _id: ObjectId;
  userId: string; // Better Auth user id
  createdAt: Date;
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

function toEntry(doc: WorkoutDoc): WorkoutEntry {
  return {
    id: doc._id.toHexString(),
    date: doc.date,
    exercise: doc.exercise,
    muscleGroup: doc.muscleGroup,
    sets: doc.sets,
    reps: doc.reps,
    weightKg: doc.weightKg,
    ...(doc.note ? { note: doc.note } : {}),
    createdAt: doc.createdAt.getTime(),
  };
}

/** Newest first. */
export async function listWorkouts(userId: string, limit = 200): Promise<WorkoutEntry[]> {
  const docs = await (await workouts())
    .find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toEntry);
}

export async function countWorkouts(userId: string): Promise<number> {
  return (await workouts()).countDocuments({ userId });
}

export async function insertWorkout(userId: string, input: WorkoutInput): Promise<WorkoutEntry> {
  const { note, ...rest } = input;
  const doc: WorkoutDoc = {
    _id: new ObjectId(),
    ...rest,
    ...(note ? { note } : {}),
    userId,
    createdAt: new Date(),
  };
  await (await workouts()).insertOne(doc);
  return toEntry(doc);
}

/** Returns false when the entry doesn't exist or belongs to someone else. */
export async function deleteWorkout(userId: string, id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await workouts()).deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}
