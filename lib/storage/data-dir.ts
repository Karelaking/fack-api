import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Local data directory resolution.
 *
 * When no database API keys are configured, Fack stores everything on the
 * local disk so all project data stays private to the machine. The directory
 * lives in the OS application-data folder so it survives deleting or
 * re-cloning the repository:
 *
 * - Windows:   %APPDATA%\fack-api
 * - macOS:     ~/Library/Application Support/fack-api
 * - Linux:     $XDG_DATA_HOME/fack-api (defaults to ~/.local/share/fack-api)
 *
 * Set FACK_DATA_DIR to override the location (used by tests and by users who
 * prefer to keep the database next to the project).
 */

export interface LocalDatabaseResolution {
  /** Absolute path of the SQLite file used in local mode. */
  databasePath: string;
  /** Set when a legacy `./data/fack.db` was migrated to the new location. */
  migratedFrom?: string;
  /** Migration problem, if any. The legacy file is left untouched in that case. */
  warning?: string;
}

/** Returns the OS-appropriate application data directory for Fack. */
export function resolveDataDir(): string {
  const override = process.env.FACK_DATA_DIR?.trim();
  if (override) {
    return path.resolve(override);
  }

  if (process.platform === "win32") {
    const roaming =
      process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(roaming, "fack-api");
  }

  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "fack-api",
    );
  }

  const xdgDataHome =
    process.env.XDG_DATA_HOME?.trim() ||
    path.join(os.homedir(), ".local", "share");
  return path.join(xdgDataHome, "fack-api");
}

/** Creates the data directory (and its parents) if missing and returns it. */
export function ensureDataDir(): string {
  const dir = resolveDataDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Absolute path of the default local SQLite database file. */
export function localDatabasePath(): string {
  return path.join(ensureDataDir(), "fack.db");
}

/**
 * Legacy location used by earlier versions: a `data/` folder next to the
 * project. Only used to detect and migrate existing databases.
 */
export function legacyDatabasePath(): string {
  return path.resolve(process.cwd(), "data", "fack.db");
}

/**
 * Resolves the local database file and performs a one-time migration of the
 * legacy project-local database (`<cwd>/data/fack.db`) into the app-data
 * directory.
 *
 * Safety rules:
 * - Only runs when the destination does not exist yet (never overwrites).
 * - Copies, verifies size, then deletes the legacy file. On any failure the
 *   legacy file is left untouched and a warning is returned.
 * - Never runs in tests (NODE_ENV=test) or when FACK_DATA_DIR is set
 *   explicitly — an explicit override means "leave my files alone".
 * - When both locations point at the same file, nothing happens.
 *
 * `options` exists so tests can point at temporary directories instead of
 * the real app-data/legacy locations.
 */
export function resolveLocalDatabasePath(
  options: {
    dataDir?: string;
    legacyPath?: string;
    allowMigration?: boolean;
  } = {},
): LocalDatabaseResolution {
  const destination = options.dataDir
    ? path.join(options.dataDir, "fack.db")
    : localDatabasePath();
  const legacy = options.legacyPath ?? legacyDatabasePath();

  const allowMigration =
    options.allowMigration ??
    (process.env.NODE_ENV !== "test" && !process.env.FACK_DATA_DIR?.trim());

  if (!allowMigration || !fs.existsSync(legacy)) {
    return { databasePath: destination };
  }

  if (legacy === destination || fs.existsSync(destination)) {
    // Same file, or the new location already exists: leave the legacy file
    // alone and keep using the destination.
    return { databasePath: destination };
  }

  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(legacy, destination);

    const legacySize = fs.statSync(legacy).size;
    const copiedSize = fs.statSync(destination).size;
    if (legacySize !== copiedSize) {
      fs.rmSync(destination, { force: true });
      return {
        databasePath: destination,
        warning: `Legacy database migration failed verification (copied ${copiedSize} of ${legacySize} bytes). Your data is untouched at ${legacy}.`,
      };
    }

    // Carry over SQLite sidecar files (WAL/journal) if present.
    for (const suffix of ["-journal", "-wal", "-shm"]) {
      const sidecar = `${legacy}${suffix}`;
      if (fs.existsSync(sidecar)) {
        fs.copyFileSync(sidecar, `${destination}${suffix}`);
      }
    }

    for (const suffix of ["", "-journal", "-wal", "-shm"]) {
      fs.rmSync(`${legacy}${suffix}`, { force: true });
    }

    return {
      databasePath: destination,
      migratedFrom: legacy,
    };
  } catch (error) {
    return {
      databasePath: destination,
      warning: `Could not migrate the legacy database from ${legacy}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
