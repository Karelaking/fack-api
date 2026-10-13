import fs from "node:fs";
import path from "node:path";
import { vi } from "vite-plus/test";

const testDatabasePath = path.resolve(
  process.cwd(),
  "data",
  `test-fack-${process.pid}.db`,
);
fs.mkdirSync(path.dirname(testDatabasePath), { recursive: true });
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  fs.rmSync(`${testDatabasePath}${suffix}`, { force: true });
}
process.env.DATABASE_URL = `file:${testDatabasePath}`;
delete process.env.DATABASE_AUTH_TOKEN;

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "user_test_owner" }),
  currentUser: async () => ({ id: "user_test_owner" }),
  clerkMiddleware:
    (
      handler: (
        auth: { protect: () => Promise<void> },
        request: Request,
      ) => unknown,
    ) =>
    (request: Request) =>
      handler({ protect: async () => undefined }, request),
  createRouteMatcher: (patterns: string[]) => (request: Request) =>
    patterns.some((pattern) => {
      const prefix = pattern.replace("(.*)", "");
      return new URL(request.url).pathname.startsWith(prefix);
    }),
}));

const { runMigrations } = await import("../db/migrate");
await runMigrations();
