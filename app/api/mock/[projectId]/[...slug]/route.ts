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
import { projects, endpoints, routes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findMatchingRoute } from "@/lib/route-matcher";
import {
  generatePayload,
  applyLatency,
  shouldError,
  buildResponse,
  buildErrorResponse,
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
  try {
    // ── 1. Extract Route Parameters ──────────────────────────────────────
    // In Next.js 16, params is a Promise that must be awaited
    const { projectId, slug } = await context.params;
    const requestPath = "/" + (slug?.join("/") ?? "");
    const method = request.method;

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
          // Combine endpoint basePath with route path for full matching
          path: normalizePath(`${endpoint.basePath}${route.path}`),
        }))
    );

    // ── 4. Match the Incoming Path Against Route Patterns ────────────────
    const matchResult = findMatchingRoute(allRoutes, method, requestPath);

    if (!matchResult) {
      return buildResponse(
        {
          error: true,
          message: `No ${method} route matches "${requestPath}"`,
          availableRoutes: allRoutes.map((r) => ({
            method: r.method,
            path: r.path,
          })),
        },
        404
      );
    }

    const { route, params } = matchResult;

    // ── 5. Chaos Engineering: Error Simulation ───────────────────────────
    if (shouldError(route.errorRate ?? 0)) {
      // Apply latency even to error responses for realism
      await applyLatency(route.latencyMin ?? 0, route.latencyMax ?? 0);

      return buildErrorResponse(
        500,
        `Simulated error for ${method} ${requestPath} (error rate: ${route.errorRate}%)`
      );
    }

    // ── 6. Apply Simulated Latency ───────────────────────────────────────
    await applyLatency(route.latencyMin ?? 0, route.latencyMax ?? 0);

    // ── 7. Generate Mock Payload ─────────────────────────────────────────
    let schema: Record<string, unknown> = {};
    try {
      schema = JSON.parse(route.responseSchema ?? "{}");
    } catch {
      console.warn(`[fack-api] Invalid JSON schema for route ${route.id}`);
    }

    // Inject extracted path parameters into the schema context
    // This allows generated data to reference URL params
    const payload = await generatePayload({
      ...schema,
      // Make path params available in the generated data
      ...(Object.keys(params).length > 0 && {
        properties: {
          ...(schema.properties as Record<string, unknown> | undefined),
        },
      }),
    });

    // ── 8. Parse Custom Headers ──────────────────────────────────────────
    let customHeaders: Record<string, string> = {};
    try {
      customHeaders = JSON.parse(route.customHeaders ?? "{}");
    } catch {
      console.warn(`[fack-api] Invalid custom headers for route ${route.id}`);
    }

    // ── 9. Build and Return Response ─────────────────────────────────────
    return buildResponse(payload, route.statusCode, customHeaders);
  } catch (error) {
    console.error("[fack-api] Mock request handler error:", error);
    return buildErrorResponse(500, "Internal mock server error");
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
