import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

// Standardize database URL. If it's a local path, prefix it with "file:" for @libsql/client
let url = process.env.DATABASE_URL ?? "file:./data/fack.db";
if (!url.includes("://") && !url.startsWith("file:")) {
  url = `file:${url}`;
}

const DATABASE_URL = url;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

function createDatabase() {
  // Ensure the local data directory exists if using a local file URL
  if (DATABASE_URL.startsWith("file:")) {
    const dbPath = path.resolve(DATABASE_URL.replace("file:", ""));
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }


  const client = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

// Singleton pattern — reuse across hot reloads in development
const globalForDb = globalThis as unknown as {
  __fackApiDb: ReturnType<typeof createDatabase> | undefined;
};

export const db = globalForDb.__fackApiDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__fackApiDb = db;
}
