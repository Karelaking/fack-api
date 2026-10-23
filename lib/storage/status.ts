import fs from "node:fs";

import { count } from "drizzle-orm";

import { db, storageConnection } from "@/db";
import { notes, projects } from "@/db/schema";
import { resolveDataDir } from "./data-dir";
import { readWorkspaceConfig } from "./config-store";

/**
 * Storage status shown in Settings → Storage & Data.
 * Never includes the database auth token — only masked, display-safe data.
 */
export interface StorageStatus {
  mode: "local" | "cloud";
  /** Safe-to-display target (file path or remote URL without credentials). */
  target: string;
  /** Absolute local database path (local mode only). */
  localPath: string | null;
  /** Directory holding config/backups — always on this machine's disk. */
  dataDir: string;
  /** Size of the local database file in bytes (local mode only). */
  dbSizeBytes: number | null;
  counts: {
    projects: number;
    notes: number;
  };
  lastBackupAt: string | null;
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const [projectCount] = await db.select({ value: count() }).from(projects);
  const [noteCount] = await db.select({ value: count() }).from(notes);

  const config = readWorkspaceConfig();
  const isLocal = storageConnection.mode === "local";

  let dbSizeBytes: number | null = null;
  if (isLocal && storageConnection.url.startsWith("file:")) {
    try {
      dbSizeBytes = fs.statSync(
        storageConnection.url.slice("file:".length),
      ).size;
    } catch {
      dbSizeBytes = null;
    }
  }

  return {
    mode: storageConnection.mode,
    target: storageConnection.display,
    localPath: isLocal ? storageConnection.display : null,
    dataDir: resolveDataDir(),
    dbSizeBytes,
    counts: {
      projects: projectCount?.value ?? 0,
      notes: noteCount?.value ?? 0,
    },
    lastBackupAt: config.lastBackupAt ?? null,
  };
}
