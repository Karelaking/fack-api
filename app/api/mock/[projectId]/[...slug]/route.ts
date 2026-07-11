/**
 * Fack API's — Catch-All Mock API Route Handler
 *
 * This is the central route handler for all mock API requests.
 * It processes requests that have been rewritten by proxy.ts from
 * `/mock/:projectId/*` to `/api/mock/:projectId/*`.
 *
 * The `[...slug]` catch-all segment captures all URL segments after
 * the projectId, allowing a single file to handle infinite path variations.
 *
 * Request lifecycle:
 * 1. Extract projectId and reconstruct the request path from slug segments
 * 2. Query the database for the project and its enabled routes
 * 3. Use path-to-regexp to match the incoming path against route patterns
 * 4. If matched:
 *    a. Check if an error should be simulated (chaos engineering)
 *    b. Apply configured latency delay
 *    c. Generate fake data payload from the route's JSON Schema
 *    d. Return response with custom headers and CORS
 * 5. If no match: return 404 with a list of available routes
 *
 * @see proxy.ts — The proxy layer that rewrites requests to this handler
 * @see lib/route-matcher.ts — Path matching logic
 * @see lib/mock-engine.ts — Payload generation and chaos simulation
 */

import type { NextRequest } from "next/server";
import { db } from "@/db";
import { projects, endpoints, type Project } from "@/db/schema";
import { sqlClient } from "@/db/postgres";
import { eq } from "drizzle-orm";
import { findMatchingRoute } from "@/lib/route-matcher";
import {
  generatePayload,
  applyLatency,
  shouldError,
  buildResponse,
  buildErrorResponse,
  processQueryParameters,
  evaluateRules,
} from "@/lib/mock-engine";

export const dynamic = "force-dynamic";

// ─── Route Handler Exports ───────────────────────────────────────────────────

/**
 * Each exported function handles the corresponding HTTP method.
 * They all delegate to the shared `handleMockRequest` function.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/mock/[projectId]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/mock/[projectId]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/mock/[projectId]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/mock/[projectId]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/mock/[projectId]/[...slug]">
) {
  return handleMockRequest(request, context);
}

// ─── Core Request Handler ────────────────────────────────────────────────────

/**
 * Central handler for all mock API requests regardless of HTTP method.
 *
 * @param request - The incoming NextRequest object
 * @param context - Route context containing the dynamic params (projectId, slug)
 * @returns A Response object with mock data or an error
 */
async function handleMockRequest(
  request: NextRequest,
  context: RouteContext<"/api/mock/[projectId]/[...slug]">
): Promise<Response> {
  const startTime = Date.now();
  let projectEntity: Project | null = null;
  let matchedPath = "";
  let matchedMethod = request.method;
  const logRequest = async (statusCode: number, isError: boolean, payload: unknown) => {
    if (!projectEntity || !projectEntity.isLoggingEnabled) return;
    const queryParams = JSON.stringify(Object.fromEntries(request.nextUrl.searchParams));
    const reqHeaders = JSON.stringify(Object.fromEntries(request.headers));
    const resPayload = typeof payload === "string" ? payload : JSON.stringify(payload).slice(0, 5000);

    try {
      if (sqlClient) {
        await sqlClient`
          INSERT INTO request_logs (id, project_id, timestamp, method, path, query_params, headers, status_code, latency, is_error, response_payload)
          VALUES (${crypto.randomUUID()}, ${projectEntity.id}, ${Date.now()}, ${matchedMethod}, ${matchedPath || request.nextUrl.pathname}, ${queryParams}, ${reqHeaders}, ${statusCode}, ${Date.now() - startTime}, ${isError}, ${resPayload})
        `;
      } else {
        const isErrorInt = isError ? 1 : 0;
        await db.$client.execute({
          sql: `INSERT INTO request_logs (id, project_id, timestamp, method, path, query_params, headers, status_code, latency, is_error, response_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            projectEntity.id,
            Date.now(),
            matchedMethod,
            matchedPath || request.nextUrl.pathname,
            queryParams,
            reqHeaders,
            statusCode,
            Date.now() - startTime,
            isErrorInt,
            resPayload
          ]
        });
      }
    } catch (e) {
      console.error("[fack-api] Failed to save request log:", e);
    }
  };

  try {
    // ── 1. Extract Route Parameters ──────────────────────────────────────
    const { projectId, slug } = await context.params;
    const requestPath = "/" + (slug?.join("/") ?? "");
    matchedPath = requestPath;
    const method = request.method;
    matchedMethod = method;

    // ── 2. Find the Project ──────────────────────────────────────────────
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId),
    });

    if (!project) {
      return buildResponse(
        {
          error: true,
          message: `Project "${projectId}" not found`,
          hint: "Check that the project slug in the URL matches an existing project.",
        },
        404
      );
    }
    projectEntity = project;

    // ── 3. Load All Enabled Routes for This Project ──────────────────────
    const projectEndpoints = await db.query.endpoints.findMany({
      where: eq(endpoints.projectId, project.id),
      with: {
        routes: true,
      },
    });

    // Flatten all routes across endpoints, prepending the endpoint's basePath
    const allRoutes = projectEndpoints.flatMap((endpoint) =>
      endpoint.routes
        .filter((route) => route.isEnabled)
        .map((route) => ({
          ...route,
          path: normalizePath(`${endpoint.basePath}${route.path}`),
        }))
    );

    // ── 4. Match the Incoming Path Against Route Patterns ────────────────
    const matchResult = findMatchingRoute(allRoutes, method, requestPath);

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
      await logRequest(404, true, errBody);
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
      const response = buildResponse(ruleMatch.body, ruleMatch.status, customHeaders);
      await logRequest(ruleMatch.status, ruleMatch.status >= 400, ruleMatch.body);
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
      await logRequest(500, true, errBody);
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
    const limitParam = searchParams.get("limit") || searchParams.get("_limit") || searchParams.get("count");

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

    const rawPayload = await generatePayload({
      ...targetSchema,
      ...(Object.keys(params).length > 0 && {
        properties: {
          ...(targetSchema.properties as Record<string, unknown> | undefined),
        },
      }),
    }, limitValue);

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
    await logRequest(route.statusCode, route.statusCode >= 400, payload);
    return response;
  } catch (error) {
    console.error("[fack-api] Mock request handler error:", error);
    const errBody = { error: true, message: "Internal mock server error" };
    const response = buildErrorResponse(500, errBody.message);
    if (projectEntity) {
      await logRequest(500, true, errBody);
    }
    return response;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalizes a URL path by collapsing multiple slashes and ensuring
 * a leading slash. Handles edge cases from basePath + path concatenation.
 *
 * @param path - Raw path string to normalize
 * @returns Normalized path with single slashes and leading /
 *
 * @example
 * ```ts
 * normalizePath("//users///123//")  // → "/users/123"
 * normalizePath("users/123")        // → "/users/123"
 * ```
 */
function normalizePath(path: string): string {
  const normalized = ("/" + path).replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}
