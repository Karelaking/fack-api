import fs from "node:fs";
import path from "node:path";

import { ensureDataDir } from "./data-dir";

/**
 * Local JSON configuration store.
 *
 * App-level preferences (workspace name, backup bookkeeping) are kept in a
 * plain JSON file inside the OS data directory, so they live on the local
 * disk next to the database and never leave the machine in local mode.
 * Writes are atomic: a temp file is written first and then renamed over the
 * target, so a crash can never leave a half-written config behind.
 */

export interface WorkspaceConfig {
  workspaceName?: string;
  lastBackupAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Absolute path of the JSON config file. */
export function configFilePath(): string {
  return path.join(ensureDataDir(), "config", "app-config.json");
}

/** Reads the config; missing or unreadable files yield empty defaults. */
export function readWorkspaceConfig(): WorkspaceConfig {
  try {
    const raw = fs.readFileSync(configFilePath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as WorkspaceConfig;
    }
  } catch {
    // Missing or corrupt file → fall through to defaults.
  }
  return {};
}

/** Merges a patch into the config and persists it atomically. */
export function writeWorkspaceConfig(
  patch: Partial<WorkspaceConfig>,
): WorkspaceConfig {
  const current = readWorkspaceConfig();
  const next: WorkspaceConfig = {
    ...current,
    ...patch,
    createdAt: current.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const file = configFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const tempFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(next, null, 2), "utf8");
  fs.renameSync(tempFile, file);

  return next;
}
