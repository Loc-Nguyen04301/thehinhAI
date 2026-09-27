import "server-only";
import { MongoClient, ObjectId, type Db } from "mongodb";

// Reuse one client per process; in dev, survive hot reloads via globalThis.
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

/**
 * Created lazily so `next build` doesn't need MONGODB_URI. The driver connects on first query.
 * Holders of the client (e.g. getAuth()) should compare it with this function's result
 * and rebuild when it changed.
 */
export function getMongoClient(): MongoClient {
  if (!globalForMongo.mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
    const client = new MongoClient(uri, { appName: "thehinh-ai" });
    // When the first connection fails (e.g. Atlas Network Access blocks this server's IP),
    // the driver closes the client for good: every later query throws "Topology is closed",
    // even once Atlas is reachable. Forget it so the next request starts a fresh client.
    client.once("topologyClosed", () => {
      if (globalForMongo.mongoClient === client) globalForMongo.mongoClient = undefined;
    });
    globalForMongo.mongoClient = client;
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
