import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import fs from "node:fs";
import { db } from "./index";
import { dbLogger } from "@/lib/logger";

/**
 * Runs pending database migrations.
 * Self-healing:
 * - If database is empty, runs all migrations from scratch.
 * - If database tables already exist (e.g. created via db:push) but __drizzle_migrations is unpopulated,
 *   synchronizes __drizzle_migrations to the latest applied schema state so future migrations work seamlessly.
 * - Catches duplicate column/table errors gracefully so the app never fails to start.
 */
export async function runMigrations(): Promise<void> {
  try {
    // 1. Check if the "projects" table exists
    const tableCheck = await db.$client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'",
    );

    if (tableCheck.rows.length > 0) {
      // Ensure __drizzle_migrations table exists
      await db.$client.execute(`
                CREATE TABLE IF NOT EXISTS __drizzle_migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash text NOT NULL,
                    created_at numeric
                )
            `);

      // Check if projects already has is_caching_enabled column
      const colCheck = await db.$client.execute("PRAGMA table_info(projects)");
      const colNames = colCheck.rows.map((r) => r.name);

      if (colNames.includes("is_caching_enabled")) {
        // Ensure the 0003 migration (1784660622086) is recorded so Drizzle doesn't re-attempt
        const recordCheck = await db.$client.execute({
          sql: "SELECT id FROM __drizzle_migrations WHERE created_at = ?",
          args: [1784660622086],
        });

        if (recordCheck.rows.length === 0) {
          await db.$client.execute({
            sql: `INSERT INTO __drizzle_migrations ("hash", "created_at") VALUES (?, ?)`,
            args: [
              "c9e814711db525e689171edd88cc8bd5520fc6e58f0c860697e3e017db686154",
              1784660622086,
            ],
          });
          dbLogger.info(
            "Synchronized __drizzle_migrations: registered is_caching_enabled migration as applied.",
          );
        }
      }
    }

    // 2. Run pending migrations safely
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

    if (!fs.existsSync(journalPath)) {
      dbLogger.warn(
        `Migration journal file not found at ${journalPath}. Skipping file-based migrations.`,
      );
      return;
    }

    try {
      await migrate(db, { migrationsFolder });
      dbLogger.success("Database migrations checked and applied successfully.");
    } catch (migrationError: unknown) {
      const message = String(migrationError);
      if (
        message.includes("duplicate column name") ||
        message.includes("already exists")
      ) {
        dbLogger.warn(
          "Database schema columns already present. Skipping duplicate migration:",
          message,
        );
      } else {
        dbLogger.error("Failed to apply database migration:", migrationError);
      }
    }
  } catch (error) {
    dbLogger.error("Failed to run database migrations:", error);
  }
}
