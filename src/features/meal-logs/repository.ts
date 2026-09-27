import "server-only";
import { ObjectId, type Collection } from "mongodb";
import { getDb, toObjectId } from "@/lib/db";
import type { DateRange, MealLogEntry, MealLogInput } from "./types";

// MongoDB access for the daily kcal log. Callers must pass the *signed-in* user's id —
// every query is scoped by userId so nobody can read or delete another user's data.

type MealLogDoc = MealLogInput & {
  _id: ObjectId;
  userId: ObjectId; // → user._id
  createdAt: Date;
  updatedAt?: Date; // set when the entry is edited
};

let indexesReady: Promise<unknown> | undefined;

async function mealLogs(): Promise<Collection<MealLogDoc>> {
  const collection = getDb().collection<MealLogDoc>("mealLogs");
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

function toEntry(doc: MealLogDoc): MealLogEntry {
  return {
    id: doc._id.toHexString(),
    date: doc.date,
    name: doc.name,
    grams: doc.grams,
    kcal: doc.kcal,
    ...(doc.note ? { note: doc.note } : {}),
    createdAt: doc.createdAt.getTime(),
  };
}

/** Newest first; only days within `range` (inclusive) when given. */
export async function listMealLogs(
  userId: string,
  { range, limit = 300 }: { range?: DateRange; limit?: number } = {},
): Promise<MealLogEntry[]> {
  const docs = await (await mealLogs())
    .find({
      userId: userObjectId(userId),
      // YYYY-MM-DD strings sort like dates, so plain string bounds work (and use the index)
      ...(range ? { date: { $gte: range.from, $lte: range.to } } : {}),
    })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toEntry);
}

export async function insertMealLog(userId: string, input: MealLogInput): Promise<MealLogEntry> {
  const { note, ...rest } = input;
  const doc: MealLogDoc = {
    _id: new ObjectId(),
    ...rest,
    ...(note ? { note } : {}),
    userId: userObjectId(userId),
    createdAt: new Date(),
  };
  await (await mealLogs()).insertOne(doc);
  return toEntry(doc);
}

/** Replaces the editable fields. Returns false when the entry doesn't exist or belongs to someone else. */
export async function updateMealLog(
  userId: string,
  id: string,
  input: MealLogInput,
): Promise<boolean> {
  const mealLogId = toObjectId(id);
  if (!mealLogId) return false;
  const { note, ...rest } = input;
  const result = await (await mealLogs()).updateOne(
    { _id: mealLogId, userId: userObjectId(userId) },
    {
      $set: { ...rest, ...(note ? { note } : {}), updatedAt: new Date() },
      ...(note ? {} : { $unset: { note: "" } }), // note cleared in the form
    },
  );
  return result.matchedCount === 1;
}

/** Returns false when the entry doesn't exist or belongs to someone else. */
export async function deleteMealLog(userId: string, id: string): Promise<boolean> {
  const mealLogId = toObjectId(id);
  if (!mealLogId) return false;
  const result = await (await mealLogs()).deleteOne({ _id: mealLogId, userId: userObjectId(userId) });
  return result.deletedCount === 1;
}
