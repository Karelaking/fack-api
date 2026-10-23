import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

import { dbLogger } from "@/lib/logger";
import { resolveStorageConnection } from "@/lib/storage/mode";

// Resolve where project data lives: a private local file when no database
// API keys are configured, or a remote libSQL/Turso database when they are.
const connection = resolveStorageConnection();

if (connection.warning) {
  dbLogger.warn(connection.warning);
}

dbLogger.info(
  connection.mode === "local"
    ? `Storage mode: LOCAL — all project data stays on this machine (${connection.display})`
    : `Storage mode: CLOUD — project data is stored remotely (${connection.display})`,
);

const DATABASE_URL = connection.url;
const DATABASE_AUTH_TOKEN = connection.authToken;

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

  // Bootstrap request_logs in SQLite/Turso if it does not exist
  client
    .execute(
      `
    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      query_params TEXT DEFAULT '{}',
      headers TEXT DEFAULT '{}',
      status_code INTEGER NOT NULL,
      latency INTEGER NOT NULL,
      is_error INTEGER NOT NULL,
      response_payload TEXT DEFAULT ''
    );
  `,
    )
    .then(() => {
      // Bootstrap index for query performance
      return client.execute(`
      CREATE INDEX IF NOT EXISTS idx_request_logs_project_timestamp 
      ON request_logs(project_id, timestamp DESC);
    `);
    })
    .catch((err) => {
      dbLogger.error(
        "Failed to bootstrap SQLite request_logs table/index:",
        err,
      );
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

/** Active storage connection (mode, masked target) for status/settings UI. */
export const storageConnection = connection;
