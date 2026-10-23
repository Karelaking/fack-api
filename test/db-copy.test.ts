import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { createClient, type Client } from "@libsql/client";

import { copyTable, orderedTables, toClientUrl } from "../scripts/db-copy.mjs";

/**
 * db:copy primitives — table ordering, endpoint resolution, and the
 * raw-SQL row copy (with upsert) used to move data local ⇄ cloud.
 */

const ORIGINAL_FACK_DATA_DIR = process.env.FACK_DATA_DIR;
let tempDir: string;
const clients: Client[] = [];

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fack-dbcopy-"));
  process.env.FACK_DATA_DIR = tempDir;
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.close();
  // libsql releases its file handles asynchronously; give Windows a moment
  // before removing the temporary database files.
  await new Promise((resolve) => setTimeout(resolve, 25));
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore lingering locks — the OS cleans the temp directory anyway.
  }
  if (ORIGINAL_FACK_DATA_DIR === undefined) {
    delete process.env.FACK_DATA_DIR;
  } else {
    process.env.FACK_DATA_DIR = ORIGINAL_FACK_DATA_DIR;
  }
});

async function createDb(name: string): Promise<Client> {
  const client = createClient({ url: `file:${path.join(tempDir, name)}` });
  clients.push(client);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_caching_enabled INTEGER NOT NULL DEFAULT 1
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT ''
    )
  `);
  return client;
}

describe("orderedTables", () => {
  it("places parent tables before children", () => {
    const ordered = orderedTables([
      "notes",
      "routes",
      "projects",
      "endpoints",
      "unknown_extra",
    ]);

    expect(ordered.indexOf("projects")).toBeLessThan(
      ordered.indexOf("endpoints"),
    );
    expect(ordered.indexOf("endpoints")).toBeLessThan(
      ordered.indexOf("routes"),
    );
    // Unknown tables are still copied, just last.
    expect(ordered[ordered.length - 1]).toBe("unknown_extra");
  });
});

describe("toClientUrl", () => {
  it("maps 'local' to a file URL inside the data directory", () => {
    const { url } = toClientUrl("local");
    expect(url.startsWith("file:")).toBe(true);
    expect(url.endsWith("fack.db")).toBe(true);
    expect(url).toContain(tempDir);
  });

  it("passes remote URLs through and keeps bare paths local", () => {
    expect(toClientUrl("libsql://db.turso.io").url).toBe(
      "libsql://db.turso.io",
    );
    expect(toClientUrl("./somewhere/data.db").url.startsWith("file:")).toBe(
      true,
    );
  });
});

describe("copyTable", () => {
  it("copies rows from source to target", async () => {
    const source = await createDb("source.db");
    const target = await createDb("target.db");

    await source.execute(
      "INSERT INTO projects (id, name) VALUES ('p1', 'Alpha'), ('p2', 'Beta')",
    );
    await source.execute(
      "INSERT INTO notes (id, project_id, title) VALUES ('n1', 'p1', 'Note one')",
    );

    const projectsCopy = await copyTable(source, target, "projects", false);
    expect(projectsCopy).toEqual({ table: "projects", total: 2, written: 2 });
    await copyTable(source, target, "notes", false);

    const rows = await target.execute("SELECT id FROM projects ORDER BY id");
    expect(rows.rows.map((row) => row.id)).toEqual(["p1", "p2"]);
    const noteRows = await target.execute("SELECT title FROM notes");
    expect(noteRows.rows[0].title).toBe("Note one");
  });

  it("upserts rows that already exist on the target", async () => {
    const source = await createDb("source2.db");
    const target = await createDb("target2.db");

    await source.execute(
      "INSERT INTO projects (id, name) VALUES ('p1', 'Updated name')",
    );
    await target.execute(
      "INSERT INTO projects (id, name) VALUES ('p1', 'Old name')",
    );

    await copyTable(source, target, "projects", false);

    const rows = await target.execute("SELECT name FROM projects");
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].name).toBe("Updated name");
  });

  it("dry run reports counts without writing", async () => {
    const source = await createDb("source3.db");
    const target = await createDb("target3.db");

    await source.execute("INSERT INTO projects (id, name) VALUES ('p1', 'A')");

    const summary = await copyTable(source, target, "projects", true);
    expect(summary.total).toBe(1);
    expect(summary.written).toBe(0);

    const rows = await target.execute("SELECT COUNT(*) AS n FROM projects");
    expect(Number(rows.rows[0].n)).toBe(0);
  });
});
