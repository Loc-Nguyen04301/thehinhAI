// Grants a role to an existing user (e.g. the very first admin).
// Usage: npm run set-role -- <email> <role>      roles: see src/lib/permissions.ts
import { MongoClient } from "mongodb";
import { ROLE_IDS } from "../src/lib/permissions.ts";

const [email, role] = process.argv.slice(2);
if (!email || !role || !(ROLE_IDS as string[]).includes(role)) {
  console.error(`Usage: npm run set-role -- <email> <${ROLE_IDS.join("|")}>`);
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set (add it to .env.local).");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  const db = client.db(process.env.MONGODB_DB || undefined);
  // Better Auth stores users in the "user" collection.
  const result = await db.collection("user").updateOne({ email: email.toLowerCase() }, { $set: { role } });
  if (result.matchedCount === 0) {
    console.error(`No user with email ${email}. Sign up on the website first.`);
    process.exitCode = 1;
  } else {
    console.log(`${email} is now "${role}". They may need to sign out and back in.`);
  }
} finally {
  await client.close();
}
