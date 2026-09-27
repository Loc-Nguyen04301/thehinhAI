import "server-only";
import { MongoClient, ObjectId, type Db } from "mongodb";

// Reuse one client per process; in dev, survive hot reloads via globalThis.
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

/** Created lazily so `next build` doesn't need MONGODB_URI. The driver connects on first query. */
export function getMongoClient(): MongoClient {
  if (!globalForMongo.mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
    globalForMongo.mongoClient = new MongoClient(uri, { appName: "thehinh-ai" });
  }
  return globalForMongo.mongoClient;
}

/** Database name comes from MONGODB_DB, else from the URI path, else the driver default ("test"). */
export function getDb(): Db {
  return getMongoClient().db(process.env.MONGODB_DB || undefined);
}

/**
 * Hex string (e.g. `session.user.id`, an id from the client) → ObjectId, or null if malformed.
 * Stricter than ObjectId.isValid(), which also accepts any 12-character string.
 */
export function toObjectId(id: string): ObjectId | null {
  return /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null;
}
