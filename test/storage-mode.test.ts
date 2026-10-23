import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import { resolveLocalDatabasePath } from "../lib/storage/data-dir";
import {
  maskAuthToken,
  maskRemoteUrl,
  resolveStorageConnection,
} from "../lib/storage/mode";

/**
 * Storage mode resolution: local-by-default (no API keys), cloud when a
 * remote URL + auth token are configured, and a safe local fallback when
 * they are not.
 */

const ORIGINAL_FACK_DATA_DIR = process.env.FACK_DATA_DIR;
let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fack-storage-"));
  // Isolate the OS data dir so tests never touch the real app-data folder,
  // and disable the legacy migration (it would otherwise inspect ./data).
  process.env.FACK_DATA_DIR = tempDir;
});

afterEach(() => {
  if (ORIGINAL_FACK_DATA_DIR === undefined) {
    delete process.env.FACK_DATA_DIR;
  } else {
    process.env.FACK_DATA_DIR = ORIGINAL_FACK_DATA_DIR;
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("resolveStorageConnection", () => {
  it("defaults to a local file when no keys are configured", () => {
    const connection = resolveStorageConnection({});

    expect(connection.mode).toBe("local");
    expect(connection.url.startsWith("file:")).toBe(true);
    expect(connection.url.endsWith("fack.db")).toBe(true);
    expect(connection.authToken).toBeUndefined();
    expect(connection.display).toBe(connection.url.slice("file:".length));
  });

  it("keeps an explicit file: URL as local", () => {
    const connection = resolveStorageConnection({
      DATABASE_URL: "file:./custom/data.db",
    });

    expect(connection.mode).toBe("local");
    expect(connection.url).toBe("file:./custom/data.db");
    expect(connection.display).toBe("./custom/data.db");
  });

  it("normalizes a bare path to a file: URL", () => {
    const connection = resolveStorageConnection({
      DATABASE_URL: "./data/fack.db",
    });

    expect(connection.mode).toBe("local");
    expect(connection.url).toBe("file:./data/fack.db");
  });

  it("uses cloud mode for a remote URL with an auth token", () => {
    const connection = resolveStorageConnection({
      DATABASE_URL: "libsql://my-db.turso.io",
      DATABASE_AUTH_TOKEN: "secret-token",
    });

    expect(connection.mode).toBe("cloud");
    expect(connection.url).toBe("libsql://my-db.turso.io");
    expect(connection.authToken).toBe("secret-token");
    expect(connection.display).toBe("libsql://my-db.turso.io");
  });

  it("falls back to local when a libsql URL has no auth token", () => {
    const connection = resolveStorageConnection({
      DATABASE_URL: "libsql://my-db.turso.io",
    });

    expect(connection.mode).toBe("local");
    expect(connection.url.startsWith("file:")).toBe(true);
    expect(connection.warning).toContain("DATABASE_AUTH_TOKEN");
  });

  it("falls back to local when an https URL has no auth token", () => {
    const connection = resolveStorageConnection({
      DATABASE_URL: "https://my-db.turso.io",
    });

    expect(connection.mode).toBe("local");
    expect(connection.warning).toBeDefined();
  });

  it("allows plain http remotes without a token (local dev servers)", () => {
    const connection = resolveStorageConnection({
      DATABASE_URL: "http://127.0.0.1:8080",
    });

    expect(connection.mode).toBe("cloud");
    expect(connection.url).toBe("http://127.0.0.1:8080");
  });

  it("honours STORAGE_MODE=local even with cloud credentials present", () => {
    const connection = resolveStorageConnection({
      STORAGE_MODE: "local",
      DATABASE_URL: "libsql://my-db.turso.io",
      DATABASE_AUTH_TOKEN: "secret-token",
    });

    expect(connection.mode).toBe("local");
    expect(connection.authToken).toBeUndefined();
    expect(connection.warning).toContain("STORAGE_MODE=local");
  });

  it("requires a token for STORAGE_MODE=cloud", () => {
    const connection = resolveStorageConnection({
      STORAGE_MODE: "cloud",
      DATABASE_URL: "libsql://my-db.turso.io",
    });

    expect(connection.mode).toBe("local");
    expect(connection.warning).toContain("STORAGE_MODE=cloud");
  });
});

describe("secret masking", () => {
  it("never exposes the full auth token", () => {
    const masked = maskAuthToken("super-secret-token-value");
    expect(masked).not.toContain("secret-token-value");
    expect(masked.startsWith("supe")).toBe(true);
    expect(maskAuthToken("")).toBe("");
    expect(maskAuthToken(undefined)).toBe("");
  });

  it("strips embedded credentials from remote URLs", () => {
    const masked = maskRemoteUrl("libsql://user:pass@my-db.turso.io/db");
    expect(masked).not.toContain("pass");
    expect(masked).not.toContain("user");
    expect(masked).toContain("my-db.turso.io");
  });
});

describe("resolveLocalDatabasePath migration", () => {
  it("migrates a legacy database into the data directory", () => {
    const legacyDir = path.join(tempDir, "legacy");
    fs.mkdirSync(legacyDir, { recursive: true });
    const legacyPath = path.join(legacyDir, "fack.db");
    fs.writeFileSync(legacyPath, "legacy-database-bytes");

    const result = resolveLocalDatabasePath({
      dataDir: path.join(tempDir, "target"),
      legacyPath,
      allowMigration: true,
    });

    expect(result.migratedFrom).toBe(legacyPath);
    expect(result.warning).toBeUndefined();
    expect(fs.existsSync(legacyPath)).toBe(false);
    expect(fs.readFileSync(result.databasePath, "utf8")).toBe(
      "legacy-database-bytes",
    );
  });

  it("never overwrites an existing destination database", () => {
    const legacyDir = path.join(tempDir, "legacy2");
    const targetDir = path.join(tempDir, "target2");
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
    const legacyPath = path.join(legacyDir, "fack.db");
    fs.writeFileSync(legacyPath, "old");
    fs.writeFileSync(path.join(targetDir, "fack.db"), "current");

    const result = resolveLocalDatabasePath({
      dataDir: targetDir,
      legacyPath,
      allowMigration: true,
    });

    expect(result.migratedFrom).toBeUndefined();
    expect(fs.readFileSync(result.databasePath, "utf8")).toBe("current");
    expect(fs.readFileSync(legacyPath, "utf8")).toBe("old");
  });

  it("does not touch the legacy file when migration is disabled", () => {
    const legacyDir = path.join(tempDir, "legacy3");
    fs.mkdirSync(legacyDir, { recursive: true });
    const legacyPath = path.join(legacyDir, "fack.db");
    fs.writeFileSync(legacyPath, "keep-me");

    const result = resolveLocalDatabasePath({
      dataDir: path.join(tempDir, "target3"),
      legacyPath,
      allowMigration: false,
    });

    expect(result.migratedFrom).toBeUndefined();
    expect(fs.existsSync(legacyPath)).toBe(true);
  });
});
