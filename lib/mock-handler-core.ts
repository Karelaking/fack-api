import type { NextRequest } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { endpoints, type Project } from "@/db/schema";
import { sqlClient } from "@/db/postgres";
import { eq } from "drizzle-orm";
import { findMatchingRoute } from "@/lib/route-matcher";
import { getCachedRoutes, setCachedRoutes } from "@/lib/cache";
import {
  generatePayload,
  applyLatency,
  shouldError,
  buildResponse,
  buildErrorResponse,
  processQueryParameters,
  evaluateRules,
} from "@/lib/mock-engine";

/**
 * Normalizes a URL path by collapsing multiple slashes and ensuring
 * a leading slash. Handles edge cases from basePath + path concatenation.
 */
function normalizePath(path: string): string {
  const normalized = ("/" + path).replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

export async function processMockRequest({
  project,
  requestPath,
  request,
  startTime,
}: {
  project: Project;
  requestPath: string;
  request: NextRequest;
  startTime: number;
}): Promise<Response> {
  const matchedPath = requestPath;
  const matchedMethod = request.method;

  const logRequest = async (
    statusCode: number,
    isError: boolean,
    payload: unknown,
  ) => {
    if (!project || !project.isLoggingEnabled || !process.env.LOGS_POSTGRES_URL)
      return;
    const queryParams = JSON.stringify(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const reqHeaders = JSON.stringify(Object.fromEntries(request.headers));
    const resPayload =
      typeof payload === "string"
        ? payload
        : JSON.stringify(payload).slice(0, 5000);

    try {
      if (sqlClient) {
        await sqlClient`
          INSERT INTO request_logs (id, project_id, timestamp, method, path, query_params, headers, status_code, latency, is_error, response_payload)
          VALUES (${crypto.randomUUID()}, ${project.id}, ${Date.now()}, ${matchedMethod}, ${matchedPath || request.nextUrl.pathname}, ${queryParams}, ${reqHeaders}, ${statusCode}, ${Date.now() - startTime}, ${isError}, ${resPayload})
        `;
      } else {
        const isErrorInt = isError ? 1 : 0;
        await db.$client.execute({
          sql: `INSERT INTO request_logs (id, project_id, timestamp, method, path, query_params, headers, status_code, latency, is_error, response_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            project.id,
            Date.now(),
            matchedMethod,
            matchedPath || request.nextUrl.pathname,
            queryParams,
            reqHeaders,
            statusCode,
            Date.now() - startTime,
            isErrorInt,
            resPayload,
          ],
        });
      }
    } catch (e) {
      console.error("[fack-api] Failed to save request log:", e);
    }
  };

  try {
    const method = request.method;

    // ── 3. Load All Enabled Routes for This Project (with Cache) ─────────
    let allRoutes = getCachedRoutes(project.id);

    if (!allRoutes) {
      const projectEndpoints = await db.query.endpoints.findMany({
        where: eq(endpoints.projectId, project.id),
        with: {
          routes: true,
        },
      });

      // Flatten all routes across endpoints, prepending the endpoint's basePath
      allRoutes = projectEndpoints.flatMap((endpoint) =>
        endpoint.routes
          .filter((route) => route.isEnabled)
          .map((route) => ({
            ...route,
            path: normalizePath(`${endpoint.basePath}${route.path}`),
          })),
      );

      setCachedRoutes(project.id, allRoutes);
    }

    // ── 4. Match the Incoming Path Against Route Patterns ────────────────
    const matchResult = findMatchingRoute(
      allRoutes,
      method,
      normalizePath(requestPath),
    );

    if (!matchResult) {
      const errBody = {
        error: true,
        message: `No ${method} route matches "${requestPath}"`,
        availableRoutes: allRoutes.map((r) => ({
          method: r.method,
          path: r.path,
        })),
      };
      const response = buildResponse(errBody, 404);
      after(() => logRequest(404, true, errBody));
      return response;
    }

    const { route, params } = matchResult;

    // ── 5. Smart Conditional Rules Check ─────────────────────────────────
    const ruleMatch = evaluateRules(route.conditionalRules, request, params);
    if (ruleMatch) {
      await applyLatency(route.latencyMin ?? 0, route.latencyMax ?? 0);
      let customHeaders: Record<string, string> = {};
      try {
        customHeaders = JSON.parse(route.customHeaders ?? "{}");
      } catch {}
      const response = buildResponse(
        ruleMatch.body,
        ruleMatch.status,
        customHeaders,
      );
      after(() =>
        logRequest(ruleMatch.status, ruleMatch.status >= 400, ruleMatch.body),
      );
      return response;
    }

    // ── 6. Chaos Engineering: Error Simulation ───────────────────────────
    if (shouldError(route.errorRate ?? 0)) {
      await applyLatency(route.latencyMin ?? 0, route.latencyMax ?? 0);
      const errBody = {
        error: true,
        message: `Simulated error for ${method} ${requestPath} (error rate: ${route.errorRate}%)`,
      };
      const response = buildErrorResponse(500, errBody.message);
      after(() => logRequest(500, true, errBody));
      return response;
    }

    // ── 7. Apply Simulated Latency ───────────────────────────────────────
    await applyLatency(route.latencyMin ?? 0, route.latencyMax ?? 0);

    // ── 8. Generate Mock Payload ─────────────────────────────────────────
    let schema: Record<string, unknown> = {};
    try {
      schema = JSON.parse(route.responseSchema ?? "{}");
    } catch {
      console.warn(`[fack-api] Invalid JSON schema for route ${route.id}`);
    }

    // Parse pagination parameters (page, limit) to dynamically expand generated array size
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page") || searchParams.get("_page");
    const limitParam =
      searchParams.get("limit") ||
      searchParams.get("_limit") ||
      searchParams.get("count");

    let limitValue: number | undefined = undefined;
    let pageValue: number = 1;

    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        pageValue = parsedPage;
      }
    }

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limitValue = pageValue > 1 ? pageValue * parsedLimit : parsedLimit;
      }
    }

    const isListRoute = !route.path.includes(":");
    let shouldWrapAsArray = false;
    if (schema.type === "object") {
      if (isListRoute || limitParam || pageParam) {
        shouldWrapAsArray = true;
      }
    }

    let targetSchema = schema;
    if (shouldWrapAsArray) {
      targetSchema = {
        type: "array",
        items: schema,
      };
    }

    const rawPayload = await generatePayload(
      {
        ...targetSchema,
        ...(Object.keys(params).length > 0 && {
          properties: {
            ...(targetSchema.properties as Record<string, unknown> | undefined),
          },
        }),
      },
      limitValue,
    );

    const payload = processQueryParameters(rawPayload, searchParams);

    // ── 9. Parse Custom Headers ──────────────────────────────────────────
    let customHeaders: Record<string, string> = {};
    try {
      customHeaders = JSON.parse(route.customHeaders ?? "{}");
    } catch {
      console.warn(`[fack-api] Invalid custom headers for route ${route.id}`);
    }

    // ── 10. Build and Return Response ────────────────────────────────────
    const response = buildResponse(payload, route.statusCode, customHeaders);
    after(() => logRequest(route.statusCode, route.statusCode >= 400, payload));
    return response;
  } catch (error) {
    console.error("[fack-api] Mock request handler error:", error);
    const errBody = { error: true, message: "Internal mock server error" };
    const response = buildErrorResponse(500, errBody.message);
    after(() => logRequest(500, true, errBody));
    return response;
  }
}
