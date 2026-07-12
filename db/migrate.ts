import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

/**
 * Runs pending database migrations.
 * Called at app startup to ensure the schema is current.
 */
export async function runMigrations() {
  try {
    // Check if the "projects" table already exists in the database
    const result = await db.$client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'"
    );
    
    if (result.rows.length === 0) {
      console.log("[fack-api] Database tables do not exist. Running migrations...");
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log("[fack-api] Database migrations applied successfully.");
    } else {
      console.log("[fack-api] Database tables already exist. Skipping migration setup.");
    }
  } catch (error) {
    console.error("[fack-api] Failed to run database migrations:", error);
    throw error;
  }
}
