import { getTableColumns, getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { InValue } from "@libsql/client";

import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Full-database backup and restore.
 *
 * Backups are plain JSON so they can be downloaded to (and restored from)
 * the local disk in local mode, or moved between a local install and a
 * remote Turso database — which is how users migrate between the two
 * storage modes from the browser.
 *
 * Covered: project configuration (projects, endpoints, routes, canvas,
 * scenarios, revisions, generation data, mock state, webhooks, notes).
 * Not covered: request logs (runtime telemetry, potentially huge).
 */

export const BACKUP_VERSION = 1;

/** Insert order respects foreign keys — parents before children. */
const BACKUP_TABLES: SQLiteTable[] = [
  schema.projects,
  schema.endpoints,
  schema.canvasStates,
  schema.scenarios,
  schema.projectRevisions,
  schema.generationTasks,
  schema.generationProposals,
  schema.routes,
  schema.webhooks,
  schema.mockStates,
  schema.notes,
];

/** Fields drizzle maps between JS `Date` and unix-seconds integers. */
const DATE_FIELDS = new Set(["createdAt", "updatedAt"]);

/** Rows per SQL batch — keeps statements well under any server limit. */
const BATCH_SIZE = 100;

export interface BackupFile {
  version: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export interface RestoreResult {
  /** Rows written per table (inserted or updated). */
  tables: Record<string, number>;
}

type Row = Record<string, unknown>;

/** Serializes every table into a JSON-safe backup object. */
export async function createBackup(): Promise<BackupFile> {
  const tables: Record<string, Row[]> = {};

  for (const table of BACKUP_TABLES) {
    const rows = await db.select().from(table);
    tables[getTableName(table)] = rows as unknown as Row[];
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** Shape validation for an uploaded backup payload. */
export function parseBackup(data: unknown): BackupFile {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Backup payload must be a JSON object");
  }
  const candidate = data as Partial<BackupFile>;
  if (candidate.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (expected ${BACKUP_VERSION})`);
  }
  if (
    !candidate.tables ||
    typeof candidate.tables !== "object" ||
    Array.isArray(candidate.tables)
  ) {
    throw new Error("Backup payload is missing its tables");
  }
  return {
    version: BACKUP_VERSION,
    exportedAt:
      typeof candidate.exportedAt === "string"
        ? candidate.exportedAt
        : new Date().toISOString(),
    tables: candidate.tables,
  };
}

function asId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function rowsOf(tables: Record<string, Row[]>, name: string): Row[] {
  const rows = tables[name];
  return Array.isArray(rows) ? rows : [];
}

/**
 * Keeps only rows the caller may import: projects they own (or system
 * projects) plus the children of those projects. Rows pointing at parents
 * that were filtered out are dropped so the restored database stays
 * consistent.
 */
function filterRowsByOwnership(
  tables: Record<string, Row[]>,
  userId: string,
): Record<string, Row[]> {
  const allowedProjects = new Set(
    rowsOf(tables, "projects")
      .filter(
        (row) =>
          asId(row.id) && (row.userId === userId || row.userId === "system"),
      )
      .map((row) => row.id as string),
  );

  const allowedEndpoints = new Set(
    rowsOf(tables, "endpoints")
      .filter(
        (row) => asId(row.id) && allowedProjects.has(row.projectId as string),
      )
      .map((row) => row.id as string),
  );

  const allowedRoutes = new Set(
    rowsOf(tables, "routes")
      .filter(
        (row) => asId(row.id) && allowedEndpoints.has(row.endpointId as string),
      )
      .map((row) => row.id as string),
  );

  const allowedTasks = new Set(
    rowsOf(tables, "generation_tasks")
      .filter(
        (row) => asId(row.id) && allowedProjects.has(row.projectId as string),
      )
      .map((row) => row.id as string),
  );

  const byProject = (name: string): Row[] =>
    rowsOf(tables, name).filter(
      (row) => asId(row.id) && allowedProjects.has(row.projectId as string),
    );

  return {
    projects: rowsOf(tables, "projects").filter(
      (row) => asId(row.id) && allowedProjects.has(row.id as string),
    ),
    endpoints: rowsOf(tables, "endpoints").filter(
      (row) => asId(row.id) && allowedEndpoints.has(row.id as string),
    ),
    canvas_states: byProject("canvas_states"),
    scenarios: byProject("scenarios"),
    project_revisions: byProject("project_revisions"),
    generation_tasks: rowsOf(tables, "generation_tasks").filter(
      (row) => asId(row.id) && allowedProjects.has(row.projectId as string),
    ),
    generation_proposals: rowsOf(tables, "generation_proposals").filter(
      (row) =>
        asId(row.id) &&
        allowedProjects.has(row.projectId as string) &&
        allowedTasks.has(row.taskId as string),
    ),
    routes: rowsOf(tables, "routes").filter(
      (row) => asId(row.id) && allowedRoutes.has(row.id as string),
    ),
    webhooks: rowsOf(tables, "webhooks").filter(
      (row) => asId(row.id) && allowedRoutes.has(row.routeId as string),
    ),
    mock_states: byProject("mock_states"),
    notes: byProject("notes"),
  };
}

/**
 * Converts a JSON row into values the SQLite driver accepts.
 * Keys are JS property names (camelCase); the SQL column names come from
 * the schema, so both are tracked side by side.
 */
function toDriverValues(
  columns: Array<{ key: string; name: string }>,
  row: Row,
): InValue[] {
  return columns.map(({ key }) => {
    let value: unknown = row[key];

    if (
      DATE_FIELDS.has(key) &&
      typeof value === "string" &&
      !Number.isNaN(Date.parse(value))
    ) {
      value = new Date(value);
    }

    if (value === null || value === undefined) return null;
    if (value instanceof Date) {
      // drizzle's sqlite `integer` timestamp columns store unix seconds.
      return Math.floor(value.getTime() / 1000);
    }
    if (typeof value === "boolean") return value ? 1 : 0;
    return value as InValue;
  });
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function buildUpsertSql(tableName: string, columns: string[]): string {
  const idColumn = columns.includes("id") ? "id" : null;
  const columnList = columns.map(quoteIdent).join(", ");
  const placeholders = columns.map(() => "?").join(", ");

  if (idColumn) {
    const updates = columns
      .filter((column) => column !== idColumn)
      .map((column) => `${quoteIdent(column)}=excluded.${quoteIdent(column)}`)
      .join(", ");
    return `INSERT INTO ${quoteIdent(tableName)} (${columnList}) VALUES (${placeholders}) ON CONFLICT(${quoteIdent(idColumn)}) DO UPDATE SET ${updates}`;
  }

  return `INSERT INTO ${quoteIdent(tableName)} (${columnList}) VALUES (${placeholders})`;
}

/**
 * Merges a backup into the active database (upsert by `id`) after filtering
 * rows to those the caller owns.
 */
export async function restoreBackup(
  data: unknown,
  userId: string,
): Promise<RestoreResult> {
  const backup = parseBackup(data);
  const filtered = filterRowsByOwnership(backup.tables, userId);
  const result: RestoreResult = { tables: {} };

  for (const table of BACKUP_TABLES) {
    const tableName = getTableName(table);
    const columns = Object.entries(
      getTableColumns(table) as Record<string, { name: string }>,
    ).map(([key, column]) => ({ key, name: column.name }));

    const rows = filtered[tableName] ?? [];
    if (rows.length === 0) continue;

    const sql = buildUpsertSql(
      tableName,
      columns.map((column) => column.name),
    );
    let written = 0;

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const batch = rows.slice(start, start + BATCH_SIZE);
      const statements = batch.map((row) => ({
        sql,
        args: toDriverValues(columns, row),
      }));
      await db.$client.batch(statements, "write");
      written += batch.length;
    }

    result.tables[tableName] = written;
  }

  return result;
}
