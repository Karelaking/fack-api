#!/usr/bin/env node
/**
 * Create a timestamped backup on the local disk.
 *
 * Local mode (default): copies the SQLite file to <data-dir>/backups/.
 * Remote mode (--remote, or DATABASE_URL pointing at a libSQL URL): dumps
 * every table to a JSON file in <data-dir>/backups/ that can be re-imported
 * through Settings → Storage & Data or `db:copy`.
 *
 * Usage:
 *   node scripts/db-backup.mjs [--remote] [--token <token>] [--out <dir>]
 *
 * Auth tokens for remote databases are read from DATABASE_AUTH_TOKEN (or
 * --token) and are never written to the backup file.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createClient } from "@libsql/client";

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

const SYSTEM_TABLES = new Set(["__drizzle_migrations"]);

function parseArgs(argv) {
  const args = { remote: false, token: "", out: "" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--remote") args.remote = true;
    else if (arg === "--token") args.token = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function quote(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Copies the local SQLite file (plus WAL/journal sidecars) to backups/. */
function backupLocalFile(outDir) {
  const dataDir = resolveDataDir();
  const source = path.join(dataDir, "fack.db");
  if (!fs.existsSync(source)) {
    throw new Error(`No local database found at ${source}`);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const target = path.join(outDir, `fack-${timestamp()}.db`);
  fs.copyFileSync(source, target);
  for (const suffix of ["-journal", "-wal", "-shm"]) {
    if (fs.existsSync(`${source}${suffix}`)) {
      fs.copyFileSync(`${source}${suffix}`, `${target}${suffix}`);
    }
  }
  const size = fs.statSync(target).size;
  console.log(`✓ local backup written to ${target} (${size} bytes)`);
  return target;
}

/** Dumps every table of a (remote or local) libSQL URL to JSON. */
async function backupToJson(url, token, outDir) {
  const client = createClient({ url, authToken: token });
  try {
    await client.execute("SELECT 1");
  } catch (error) {
    console.error(
      `Could not connect to ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    return null;
  }

  const tablesResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );

  const tables = {};
  for (const row of tablesResult.rows) {
    const name = row.name;
    if (SYSTEM_TABLES.has(name)) continue;
    const result = await client.execute(`SELECT * FROM ${quote(name)}`);
    tables[name] = result.rows.map((row2) => {
      const plain = {};
      for (const column of result.columns) {
        const value = row2[column];
        // libsql can return bigint — JSON.stringify cannot handle it.
        plain[column] = typeof value === "bigint" ? Number(value) : value;
      }
      return plain;
    });
    console.log(`  ${name.padEnd(24)} ${tables[name].length} rows`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `fack-backup-${timestamp()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        tables,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`✓ JSON backup written to ${file}`);
  client.close();
  return file;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node scripts/db-backup.mjs [--remote] [--token <token>] [--out <dir>]",
    );
    return;
  }

  const outDir = args.out?.trim() || path.join(resolveDataDir(), "backups");

  const envUrl = (process.env.DATABASE_URL ?? "").trim();
  const isRemoteUrl =
    /^(libsql|https|http|wss|ws):\/\//i.test(envUrl) && envUrl.length > 0;

  if (args.remote || isRemoteUrl) {
    if (!envUrl) {
      throw new Error("--remote requires DATABASE_URL to point at a database");
    }
    const token =
      args.token || process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;
    await backupToJson(envUrl, token, outDir);
  } else {
    backupLocalFile(outDir);
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export { resolveDataDir };
