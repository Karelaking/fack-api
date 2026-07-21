import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

import { dbLogger } from "@/lib/logger";

/**
 * Runs pending database migrations.
 * Called at app startup to ensure the schema is current.
 */
export async function runMigrations() {
  try {
    // Check if the "projects" table already exists in the database
    const result = await db.$client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'",
    );

    if (result.rows.length === 0) {
      dbLogger.info("Database tables do not exist. Running migrations...");
      await migrate(db, { migrationsFolder: "./drizzle" });
      dbLogger.success("Database migrations applied successfully.");
    } else {
      dbLogger.info("Database tables already exist. Skipping migration setup.");
    }
  } catch (error) {
    dbLogger.error("Failed to run database migrations:", error);
    throw error;
  }
}
