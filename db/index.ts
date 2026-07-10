import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL ?? "./data/fack.db";

function createDatabase() {
  const dbPath = path.resolve(DATABASE_URL);
  const dbDir = path.dirname(dbPath);

  // Ensure the data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

// Singleton pattern — reuse across hot reloads in development
const globalForDb = globalThis as unknown as {
  __fackApiDb: ReturnType<typeof createDatabase> | undefined;
};

export const db = globalForDb.__fackApiDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__fackApiDb = db;
}
