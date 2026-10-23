#!/usr/bin/env node
/**
 * Remove leftover temporary databases.
 *
 * The test suite creates one `test-fack-<pid>.db` file per Vitest worker and
 * never deletes them, so repeatedly running `pnpm test` slowly grows the data
 * directory. This script removes those files only — real databases
 * (`fack.db`), backups and config files are never touched.
 *
 * Usage:
 *   node scripts/clean-test-dbs.mjs [--dir <path>] [--dry-run]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

const TEST_DB_RE = /^test-fack-.*\.db$/;
const SIDECAR_RE = /^test-fack-.*\.db-(journal|wal|shm)$/;

function parseArgs(argv) {
  const args = { dirs: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") args.dirs.push(argv[++i]);
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function cleanDir(dir, dryRun) {
  if (!fs.existsSync(dir)) return { removed: 0, bytes: 0 };

  let removed = 0;
  let bytes = 0;

  for (const entry of fs.readdirSync(dir)) {
    if (!TEST_DB_RE.test(entry) && !SIDECAR_RE.test(entry)) continue;

    const file = path.join(dir, entry);
    try {
      bytes += fs.statSync(file).size;
    } catch {
      // Already gone or unreadable — removal is what matters.
    }
    if (!dryRun) {
      try {
        fs.rmSync(file, { force: true });
      } catch (error) {
        console.warn(
          `  ! could not remove ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
    }
    removed++;
  }

  return { removed, bytes };
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node scripts/clean-test-dbs.mjs [--dir <path>]... [--dry-run]",
    );
    return;
  }

  // Default targets: the legacy project-local data folder and the OS data dir.
  const dirs =
    args.dirs.length > 0
      ? args.dirs.map((dir) => path.resolve(dir))
      : [path.resolve(process.cwd(), "data"), resolveDataDir()];

  let total = 0;
  let totalBytes = 0;

  for (const dir of dirs) {
    const { removed, bytes } = cleanDir(dir, args.dryRun);
    if (removed === 0) continue;
    console.log(
      `${args.dryRun ? "would remove" : "removed"} ${removed} temporary database file(s) from ${dir} (${formatMb(bytes)})`,
    );
    total += removed;
    totalBytes += bytes;
  }

  if (total === 0) {
    console.log("No temporary database files found.");
  } else {
    console.log(
      `✓ ${args.dryRun ? "would free" : "freed"} ${formatMb(totalBytes)} across ${total} file(s)`,
    );
  }
}

main();
