#!/usr/bin/env node
/**
 * Copy every table from one Fack database to another.
 *
 * Typical uses:
 *   - Move local data to Turso after adding database API keys.
 *   - Pull remote data back to a private local file.
 *
 * Usage:
 *   node scripts/db-copy.mjs --from local --to <url> [--token <token>] [--dry-run]
 *   node scripts/db-copy.mjs --from <url> --to local [--token <token>]
 *
 * Endpoints accept "local" (the OS app-data database — see
 * lib/storage/data-dir.ts, mirrored below) or any libSQL URL. Remote auth
 * tokens come from --token or, preferably, the DATABASE_AUTH_TOKEN env var
 * so secrets never show up in shell history.
 *
 * The target schema is created by running the Drizzle migrations before any
 * rows are copied, so a brand-new remote database works out of the box.
 */

import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

/** Mirrors lib/storage/data-dir.ts — keep both in sync. */
function resolveDataDir() {
  const override = process.env.FACK_DATA_DIR?.trim();
  if (override) return path.resolve(override);
  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"),
      "fack-api",
    );
  }
  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "fack-api",
    );
  }
  const xdg =
    process.env.XDG_DATA_HOME?.trim() ||
    path.join(os.homedir(), ".local", "share");
  return path.join(xdg, "fack-api");
}

const LOCAL_URL = `file:${path.join(resolveDataDir(), "fack.db")}`;

/** Parents before children so foreign keys line up on the target. */
const TABLE_ORDER = [
  "projects",
  "endpoints",
  "canvas_states",
  "scenarios",
  "project_revisions",
  "generation_tasks",
  "generation_proposals",
  "routes",
  "webhooks",
  "mock_states",
  "notes",
  "request_logs",
];

const SYSTEM_TABLES = new Set(["__drizzle_migrations"]);

const REQUEST_LOGS_DDL = `
  CREATE TABLE IF NOT EXISTS request_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    query_params TEXT DEFAULT '{}',
    headers TEXT DEFAULT '{}',
    status_code INTEGER NOT NULL,
    latency INTEGER NOT NULL,
    is_error INTEGER NOT NULL,
    response_payload TEXT DEFAULT ''
  );
`;

function parseArgs(argv) {
  const args = { from: "local", to: "local", token: "", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--from") args.from = argv[++i];
    else if (arg === "--to") args.to = argv[++i];
    else if (arg === "--token") args.token = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.help) return args;
  if (!args.from || !args.to) throw new Error("--from and --to are required");
  return args;
}

function toClientUrl(target, token) {
  if (target === "local" || target === "") {
    // Resolved per call so FACK_DATA_DIR overrides are always honoured.
    return { url: `file:${path.join(resolveDataDir(), "fack.db")}` };
  }
  if (target.startsWith("file:") || target.includes("://")) {
    return { url: target, authToken: token || process.env.DATABASE_AUTH_TOKEN };
  }
  // A bare path is treated as a local file.
  return { url: `file:${path.resolve(target)}` };
}

function quote(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function listTables(client) {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return result.rows
    .map((row) => row.name)
    .filter((name) => !SYSTEM_TABLES.has(name));
}

async function tableExists(client, name) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [name],
  });
  return result.rows.length > 0;
}

async function countRows(client, table) {
  const result = await client.execute(
    `SELECT COUNT(*) AS n FROM ${quote(table)}`,
  );
  return Number(result.rows[0].n);
}

function orderedTables(names) {
  const known = TABLE_ORDER.filter((name) => names.includes(name));
  const rest = names.filter((name) => !TABLE_ORDER.includes(name));
  return [...known, ...rest];
}

async function ensureTargetSchema(targetClient) {
  // Drizzle migrations create all project tables…
  try {
    await migrate(drizzle(targetClient), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    console.log("✓ target schema up to date (drizzle migrations applied)");
  } catch (error) {
    console.warn(
      `! drizzle migrations on target: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  // …and the runtime request_logs table is bootstrapped separately.
  await targetClient.execute(REQUEST_LOGS_DDL);
}

async function copyTable(sourceClient, targetClient, table, dryRun) {
  const total = await countRows(sourceClient, table);
  if (dryRun || total === 0) return { table, total, written: 0 };

  if (!(await tableExists(targetClient, table))) {
    console.warn(`! skipping ${table}: table does not exist on target`);
    return { table, total, written: 0, skipped: true };
  }

  const source = await sourceClient.execute(`SELECT * FROM ${quote(table)}`);
  if (source.rows.length === 0) return { table, total, written: 0 };

  const columns = source.columns;
  const columnList = columns.map(quote).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `${quote(column)}=excluded.${quote(column)}`)
    .join(", ");
  const sql = columns.includes("id")
    ? `INSERT INTO ${quote(table)} (${columnList}) VALUES (${placeholders}) ON CONFLICT(${quote("id")}) DO UPDATE SET ${updates}`
    : `INSERT INTO ${quote(table)} (${columnList}) VALUES (${placeholders})`;

  const statements = source.rows.map((row) => ({
    sql,
    args: columns.map((column) => {
      const value = row[column];
      return value === undefined ? null : value;
    }),
  }));

  const BATCH = 100;
  let written = 0;
  for (let start = 0; start < statements.length; start += BATCH) {
    await targetClient.batch(statements.slice(start, start + BATCH), "write");
    written += Math.min(BATCH, statements.length - start);
  }
  return { table, total, written };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node scripts/db-copy.mjs --from <local|url> --to <local|url> [--token <token>] [--dry-run]",
    );
    return;
  }

  const from = toClientUrl(args.from);
  const to = toClientUrl(args.to, args.token);

  console.log(`Copying\n  from: ${from.url}\n  to:   ${to.url}`);
  if (args.dryRun) console.log("(dry run — no rows will be written)");

  const sourceClient = createClient(from);
  const targetClient = createClient(to);

  try {
    await sourceClient.execute("SELECT 1");
    await targetClient.execute("SELECT 1");
  } catch (error) {
    console.error(
      `Could not connect: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    return;
  }

  if (!args.dryRun) await ensureTargetSchema(targetClient);

  const tables = orderedTables(await listTables(sourceClient));
  let copied = 0;

  for (const table of tables) {
    const summary = await copyTable(
      sourceClient,
      targetClient,
      table,
      args.dryRun,
    );
    if (summary.skipped) continue;
    console.log(
      `  ${table.padEnd(24)} ${String(summary.total).padStart(6)} rows` +
        (args.dryRun ? "" : ` → ${summary.written} written`),
    );
    copied += args.dryRun ? summary.total : summary.written;
  }

  console.log(`✓ ${args.dryRun ? "would copy" : "copied"} ${copied} rows`);
  sourceClient.close();
  targetClient.close();
}

// Only run when executed directly, so tests can import the helpers.
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export {
  resolveDataDir,
  LOCAL_URL,
  orderedTables,
  toClientUrl,
  listTables,
  copyTable,
};
