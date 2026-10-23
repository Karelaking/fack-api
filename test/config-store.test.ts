import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

import {
  configFilePath,
  readWorkspaceConfig,
  writeWorkspaceConfig,
} from "../lib/storage/config-store";

/**
 * The on-disk config store: private local JSON with atomic writes.
 */

const ORIGINAL_FACK_DATA_DIR = process.env.FACK_DATA_DIR;
let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fack-config-"));
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

describe("config store", () => {
  it("stores the config file inside the local data directory", () => {
    writeWorkspaceConfig({ workspaceName: "Private Workspace" });
    expect(configFilePath().startsWith(tempDir)).toBe(true);
    expect(fs.existsSync(configFilePath())).toBe(true);
  });

  it("returns empty defaults when no config exists", () => {
    expect(readWorkspaceConfig()).toEqual({});
  });

  it("round-trips values", () => {
    writeWorkspaceConfig({ workspaceName: "Acme" });
    writeWorkspaceConfig({ lastBackupAt: "2026-01-01T00:00:00.000Z" });

    const config = readWorkspaceConfig();
    expect(config.workspaceName).toBe("Acme");
    expect(config.lastBackupAt).toBe("2026-01-01T00:00:00.000Z");
    expect(config.createdAt).toBeDefined();
    expect(config.updatedAt).toBeDefined();
  });

  it("leaves no temp files behind (atomic write)", () => {
    writeWorkspaceConfig({ workspaceName: "Atomic" });
    const files = fs.readdirSync(path.dirname(configFilePath()));
    expect(files.filter((file) => file.endsWith(".tmp"))).toHaveLength(0);
  });

  it("recovers from a corrupt config file", () => {
    fs.mkdirSync(path.dirname(configFilePath()), { recursive: true });
    fs.writeFileSync(configFilePath(), "{ not json", "utf8");

    expect(readWorkspaceConfig()).toEqual({});

    const next = writeWorkspaceConfig({ workspaceName: "Recovered" });
    expect(next.workspaceName).toBe("Recovered");
    expect(readWorkspaceConfig().workspaceName).toBe("Recovered");
  });
});
