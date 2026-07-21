"use server";

import { db } from "@/db";
import { sqlClient } from "@/db/postgres";
import type { RequestLog } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { LoggerRegistry } from "@/lib/logger-registry";

const logsTrace = LoggerRegistry.getTrace("db-logs");

export async function getRequestLogs(projectId: string): Promise<RequestLog[]> {
  logsTrace.traceCall("getRequestLogs", projectId);
  if (sqlClient) {
    try {
      const rows = await sqlClient`
        SELECT id, project_id as "projectId", timestamp, method, path, query_params as "queryParams", headers, status_code as "statusCode", latency, is_error as "isError", response_payload as "responsePayload"
        FROM request_logs
        WHERE project_id = ${projectId}
        ORDER BY timestamp DESC
        LIMIT 200
      `;
      const result = rows.map((r) => ({
        id: String(r.id),
        projectId: String(r.projectId),
        timestamp: Number(r.timestamp),
        method: String(r.method),
        path: String(r.path),
        queryParams: String(r.queryParams || "{}"),
        headers: String(r.headers || "{}"),
        statusCode: Number(r.statusCode),
        latency: Number(r.latency),
        isError: Boolean(r.isError),
        responsePayload: String(r.responsePayload || ""),
      })) as RequestLog[];
      logsTrace.traceSuccess(
        "getRequestLogs (PostgreSQL)",
        `${result.length} logs`,
      );
      return result;
    } catch (err) {
      logsTrace.traceError(
        "getRequestLogs (PostgreSQL, falling back to SQLite)",
        err,
      );
    }
  }

  // Fallback to SQLite raw execution
  try {
    const res = await db.$client.execute({
      sql: `SELECT id, project_id, timestamp, method, path, query_params, headers, status_code, latency, is_error, response_payload 
            FROM request_logs WHERE project_id = ? ORDER BY timestamp DESC LIMIT 200`,
      args: [projectId],
    });

    const result = res.rows.map((row) => ({
      id: String(row.id),
      projectId: String(row.project_id),
      timestamp: Number(row.timestamp),
      method: String(row.method),
      path: String(row.path),
      queryParams: String(row.query_params || "{}"),
      headers: String(row.headers || "{}"),
      statusCode: Number(row.status_code),
      latency: Number(row.latency),
      isError: Boolean(Number(row.is_error)),
      responsePayload: String(row.response_payload || ""),
    })) as RequestLog[];
    logsTrace.traceSuccess("getRequestLogs (SQLite)", `${result.length} logs`);
    return result;
  } catch (err) {
    logsTrace.traceError("getRequestLogs (SQLite)", err);
    return [];
  }
}

export async function clearRequestLogs(projectId: string): Promise<void> {
  logsTrace.traceCall("clearRequestLogs", projectId);
  if (sqlClient) {
    try {
      await sqlClient`DELETE FROM request_logs WHERE project_id = ${projectId}`;
      revalidatePath(`/projects/[slug]/logs`, "layout");
      logsTrace.traceSuccess("clearRequestLogs (PostgreSQL)", "void");
      return;
    } catch (err) {
      logsTrace.traceError(
        "clearRequestLogs (PostgreSQL, trying SQLite fallback)",
        err,
      );
    }
  }

  try {
    await db.$client.execute({
      sql: "DELETE FROM request_logs WHERE project_id = ?",
      args: [projectId],
    });
    logsTrace.traceSuccess("clearRequestLogs (SQLite)", "void");
  } catch (err) {
    logsTrace.traceError("clearRequestLogs (SQLite)", err);
  }
  revalidatePath(`/projects/[slug]/logs`, "layout");
}
