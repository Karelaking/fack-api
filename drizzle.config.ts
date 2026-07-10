import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "libsql://fake-api-mkkatiyar.aws-ap-south-1.turso.io",
  },
});
