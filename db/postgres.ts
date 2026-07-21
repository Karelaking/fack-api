import postgres from "postgres";
import { dbLogger } from "@/lib/logger";

const pgUrl = process.env.LOGS_POSTGRES_URL?.replace(/^"|"$/g, "");

let sqlClient: ReturnType<typeof postgres> | null = null;

if (pgUrl) {
  try {
    sqlClient = postgres(pgUrl, {
      ssl:
        pgUrl.includes("sslmode=require") ||
        pgUrl.includes("supabase") ||
        pgUrl.includes("neon.tech")
          ? { rejectUnauthorized: false }
          : undefined,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {}, // Suppress database notices from outputting to terminal
    });

    // Run the table bootstrap DDL query asynchronously
    sqlClient
      .unsafe(
        `
      CREATE TABLE IF NOT EXISTS request_logs (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        method VARCHAR(10) NOT NULL,
        path TEXT NOT NULL,
        query_params TEXT DEFAULT '{}',
        headers TEXT DEFAULT '{}',
        status_code INTEGER NOT NULL,
        latency INTEGER NOT NULL,
        is_error BOOLEAN NOT NULL,
        response_payload TEXT DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_request_logs_project_timestamp ON request_logs(project_id, timestamp DESC);
    `,
      )
      .catch((err) => {
        dbLogger.error(
          "Failed to initialize request_logs table in PostgreSQL:",
          err,
        );
      });
  } catch (err) {
    dbLogger.error("Failed to create PostgreSQL client for request logs:", err);
  }
}

export { sqlClient };
export default sqlClient;
