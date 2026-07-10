/**
 * Next.js Instrumentation hook.
 * Used to run initialization code (like database migrations) at server startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("./db/migrate");
    runMigrations();
  }
}
