import { resolveLocalDatabasePath } from "./data-dir";

/**
 * Storage mode resolution — the single source of truth for whether project
 * data lives on the local disk (private, zero configuration) or in a remote
 * libSQL/Turso database (accessible from any device).
 *
 * Rules:
 * - No DATABASE_URL                       → LOCAL file in the OS data dir.
 * - file: / bare path                     → LOCAL (path normalized to file:).
 * - libsql:// or https://                 → CLOUD, requires DATABASE_AUTH_TOKEN.
 *                                           Without it we fall back to LOCAL
 *                                           instead of half-connecting.
 * - http:// or ws://                      → CLOUD without a token is allowed
 *                                           (unauthenticated local dev servers,
 *                                           e.g. `turso dev`).
 * - STORAGE_MODE=local                    → forces LOCAL even if a remote URL
 *                                           is configured.
 */

export type StorageMode = "local" | "cloud";

export interface StorageConnection {
  /** Where project data is persisted. */
  mode: StorageMode;
  /** URL handed to @libsql/client (always normalized). */
  url: string;
  /** Auth token for remote databases (never logged or returned to clients). */
  authToken?: string;
  /** Safe-to-display target, e.g. a file path or `libsql://host/db`. */
  display: string;
  /** Configuration problem worth surfacing to the user/startup log. */
  warning?: string;
}

const REMOTE_SCHEME_RE = /^(libsql|https|http|wss|ws):\/\//i;
/** Schemes that must never be contacted without an auth token. */
const AUTH_REQUIRED_SCHEMES = new Set(["libsql", "https"]);

/**
 * Returns a display-safe representation of an auth token.
 * The full token is never returned — only a short prefix and its length.
 */
export function maskAuthToken(token?: string | null): string {
  if (!token) return "";
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}…${token.length} chars`;
}

/** Strips any userinfo from a remote URL so it is safe to display/log. */
export function maskRemoteUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    // Fallback for non-standard URLs: drop anything between "//" and "@".
    return url.replace(/^(\w+:\/\/)[^/@]*@/, "$1");
  }
}

function toLocalConnection(warning?: string): StorageConnection {
  const {
    databasePath,
    migratedFrom,
    warning: migrationWarning,
  } = resolveLocalDatabasePath();

  let combinedWarning = warning ?? migrationWarning;
  if (migratedFrom) {
    const migratedNote = `Migrated local database from ${migratedFrom} to ${databasePath}.`;
    combinedWarning = combinedWarning
      ? `${combinedWarning} ${migratedNote}`
      : migratedNote;
  }

  return {
    mode: "local",
    url: `file:${databasePath}`,
    display: databasePath,
    warning: combinedWarning,
  };
}

/**
 * Resolves the active storage connection from the environment.
 * Pure with respect to its input so it can be unit-tested.
 */
export function resolveStorageConnection(
  env: Partial<NodeJS.ProcessEnv> = process.env,
): StorageConnection {
  const rawUrl = (env.DATABASE_URL ?? "").trim();
  const authToken = (env.DATABASE_AUTH_TOKEN ?? "").trim() || undefined;
  const forcedMode = (env.STORAGE_MODE ?? "").trim().toLowerCase();

  const isRemote = REMOTE_SCHEME_RE.test(rawUrl);

  if (forcedMode === "local") {
    const warning = isRemote
      ? "STORAGE_MODE=local — ignoring the configured remote DATABASE_URL; all data stays on this machine."
      : undefined;
    return toLocalConnection(warning);
  }

  if (!rawUrl || !isRemote) {
    // Local file (or unset): normalize bare paths to a file: URL.
    const url = rawUrl
      ? rawUrl.startsWith("file:") || rawUrl.includes("://")
        ? rawUrl
        : `file:${rawUrl}`
      : "";
    if (!url) return toLocalConnection();

    return {
      mode: "local",
      url,
      display: url.replace(/^file:/, ""),
    };
  }

  const scheme = rawUrl.slice(0, rawUrl.indexOf(":")).toLowerCase();

  if (
    forcedMode === "cloud" &&
    !authToken &&
    AUTH_REQUIRED_SCHEMES.has(scheme)
  ) {
    return toLocalConnection(
      `STORAGE_MODE=cloud requires DATABASE_AUTH_TOKEN for ${scheme} URLs — falling back to local storage.`,
    );
  }

  if (!authToken && AUTH_REQUIRED_SCHEMES.has(scheme)) {
    return toLocalConnection(
      `DATABASE_URL points at ${scheme} but DATABASE_AUTH_TOKEN is missing — falling back to local storage so no data is sent anywhere.`,
    );
  }

  return {
    mode: "cloud",
    url: rawUrl,
    authToken,
    display: maskRemoteUrl(rawUrl),
  };
}
