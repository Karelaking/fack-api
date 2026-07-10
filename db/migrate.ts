import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";

/**
 * Runs pending database migrations.
 * Called at app startup to ensure the schema is current.
 */
export function runMigrations() {
  try {
    migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[fack-api] Database migrations applied successfully.");
  } catch (error) {
    console.error("[fack-api] Failed to run database migrations:", error);
    throw error;
  }
}
