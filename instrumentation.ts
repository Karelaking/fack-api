/**
 * Next.js Instrumentation hook.
 * Used to run initialization code (like database migrations) at server startup.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { runMigrations } = await import("./db/migrate");
      await runMigrations();
    } catch (error) {
      console.error(
        "[fack-api] Warning: Error during startup initialization in instrumentation hook:",
        error,
      );
    }
  }
}
