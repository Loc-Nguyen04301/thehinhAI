import "server-only";
import { MongoClient, type Db } from "mongodb";

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
