import { defineConfig } from "drizzle-kit";
import { localDatabasePath } from "./lib/storage/data-dir";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? `file:${localDatabasePath()}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
