import type { NextRequest } from "next/server";
import { db } from "@/db";
import { sqlClient } from "@/db/postgres";
import { endpoints, type Project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import {
  getCachedRoutes,
  setCachedRoutes,
  getCachedMockData,
  setCachedMockData,
  getCachedSingleMockData,
  setCachedSingleMockData,
  getCachedPageData,
  setCachedPageData,
  prunePageCache,
} from "@/lib/cache";
import {
  generatePayload,
  applyLatency,
  shouldError,
  buildResponse,
  buildErrorResponse,
  processQueryParameters,
  evaluateRules,
} from "@/lib/mock-engine";
import { findMatchingRoute } from "@/lib/route-matcher";
import { LoggerRegistry } from "@/lib/logger-registry";
import { MockResponseFormatterFactory } from "@/lib/mock-formatter";

const mockLogger = LoggerRegistry.get("mock");
const mockCoreTrace = LoggerRegistry.getTrace("mock-core");

/**
 * Normalizes a URL path by collapsing multiple slashes and ensuring
 * a leading slash. Handles edge cases from basePath + path concatenation.
 */
function normalizePath(path: string): string {
  mockCoreTrace.traceCall("normalizePath", path);
  const normalized = ("/" + path).replace(/\/+/g, "/").replace(/\/$/, "");
  const res = normalized || "/";
  mockCoreTrace.traceSuccess("normalizePath", res);
  return res;
}

export interface ProcessMockRequestOptions {
  project: Project;
  requestPath: string;
  request: NextRequest;
  startTime: number;
}

/**
 * Asynchronously persists request logs to Postgres (Supabase/Neon) or local SQLite.
 */
async function recordRequestLog(
  project: Project,
  request: NextRequest,
  matchedMethod: string,
  matchedPath: string,
  statusCode: number,
  startTime: number,
  isError: boolean,
  payload: unknown,
): Promise<void> {
  if (!project || !project.isLoggingEnabled || !process.env.LOGS_POSTGRES_URL) {
    return;
  }
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
    mockLogger.error("Failed to save request log:", e);
  }
}

/**
 * Core processor for mock API requests.
 * Uses route-matcher with Express-style dynamic parameters, chaos simulation,
 * and JSON Schema Faker generation.
 */
export async function processMockRequest({
  project,
  requestPath,
  request,
  startTime,
}: ProcessMockRequestOptions): Promise<Response> {
  mockCoreTrace.traceCall(
    "processMockRequest",
    project.slug,
    requestPath,
    request.method,
  );
  const matchedPath = requestPath;
  const matchedMethod = request.method;

  const log = (status: number, isErr: boolean, data: unknown): void => {
    recordRequestLog(
      project,
      request,
      matchedMethod,
      matchedPath,
      status,
      startTime,
      isErr,
      data,
    );
  };

  try {
    const method = request.method;

    // ── 1. Load All Enabled Routes for This Project (with Cache) ─────────
    let allRoutes = getCachedRoutes(project.id);

    if (!allRoutes) {
      const projectEndpoints = await db.query.endpoints.findMany({
        where: eq(endpoints.projectId, project.id),
        with: {
          routes: true,
        },
      });
      allRoutes = projectEndpoints.flatMap((e) =>
        e.routes.map((r) => ({
          ...r,
          path: normalizePath(e.basePath + r.path),
        })),
      );
      setCachedRoutes(project.id, allRoutes);
    }

    // ── 2. Find Best Matching Route (Exact or Dynamic with Path Params) ───
    const enabledRoutes = allRoutes.filter((r) => r.isEnabled);
    const matchResult = findMatchingRoute(enabledRoutes, method, matchedPath);
    const route = matchResult?.route;
    const matchedParams = matchResult?.params ?? {};

    if (!route) {
      mockLogger.warn(
        `No active mock route matches "${method} ${matchedPath}"`,
      );
      const errBody = {
        error: true,
        message: `Mock path "${matchedPath}" not found`,
        hint: `Verify that you have created a ${method} route for path "${matchedPath}" and enabled it.`,
      };
      const response = buildResponse(errBody, 404);
      after(() => log(404, true, errBody));
      mockCoreTrace.traceSuccess("processMockRequest (route not found)", "404");
      return response;
    }

    // ── 3. Evaluate Conditional Logic Rules ──────────────────────────────
    const ruleMatch = evaluateRules(
      route.conditionalRules,
      request,
      matchedParams,
    );
    if (ruleMatch) {
      const response = buildResponse(ruleMatch.body, ruleMatch.status);
      after(() =>
        log(ruleMatch.status, ruleMatch.status >= 400, ruleMatch.body),
      );
      mockCoreTrace.traceSuccess(
        "processMockRequest (conditional rule matched)",
        ruleMatch.status,
      );
      return response;
    }

    // ── 4. Simulated Error Injection (Chaos Monkey) ──────────────────────
    if (shouldError(route.errorRate ?? 0)) {
      const response = buildErrorResponse(
        route.statusCode >= 400 ? route.statusCode : 500,
        "Simulated server error (Chaos Monkey)",
      );
      after(() =>
        log(
          route.statusCode >= 400 ? route.statusCode : 500,
          true,
          "Simulated Chaos Monkey Error",
        ),
      );
      mockCoreTrace.traceSuccess(
        "processMockRequest (chaos monkey error injected)",
        response.status,
      );
      return response;
    }

    // ── 5. Simulated Network Latency ─────────────────────────────────────
    await applyLatency(route.latencyMin ?? 0, route.latencyMax ?? 0);

    // ── 6. Schema Resolution & Payload Generation ─────────────────────────
    let schema: Record<string, unknown> = {};
    try {
      schema = JSON.parse(route.responseSchema ?? "{}");
    } catch {
      mockLogger.warn(`Invalid JSON schema for route ${route.id}`);
    }

    // Parse pagination parameters (page, limit)
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page") || searchParams.get("_page");
    const limitParam =
      searchParams.get("limit") ||
      searchParams.get("_limit") ||
      searchParams.get("count");

    let limitValue: number | undefined = undefined;
    let pageValue = 1;

    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        pageValue = parsedPage;
      }
    }
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limitValue = parsedLimit;
      }
    }

    let rawPayload: unknown;
    let isFromCache = false;

    const isArrayResponse =
      schema.type === "array" ||
      limitValue !== undefined ||
      pageParam !== null ||
      limitParam !== null;

    const isPagedRequest = pageParam !== null;
    const cachingEnabled = project.isCachingEnabled !== false;

    if (isArrayResponse) {
      let itemSchema: Record<string, unknown> = {};
      if (
        schema.type === "array" &&
        typeof schema.items === "object" &&
        schema.items !== null
      ) {
        itemSchema = schema.items as Record<string, unknown>;
      } else {
        itemSchema = schema;
      }

      const effectiveLimit = limitValue !== undefined ? limitValue : 10;

      if (isPagedRequest) {
        if (cachingEnabled) {
          let cachedPage = getCachedPageData(
            route.id,
            pageValue,
            effectiveLimit,
          );
          isFromCache = true;

          if (!cachedPage) {
            isFromCache = false;
            cachedPage = (await generatePayload(
              {
                type: "array",
                items: itemSchema,
              },
              effectiveLimit,
            )) as unknown[];
            setCachedPageData(route.id, pageValue, effectiveLimit, cachedPage);
          }

          prunePageCache(route.id, pageValue, effectiveLimit);
          rawPayload = cachedPage;

          // Prefetch next page asynchronously
          after(async () => {
            try {
              const nextPage = pageValue + 1;
              const hasNextCached = getCachedPageData(
                route.id,
                nextPage,
                effectiveLimit,
              );
              if (!hasNextCached) {
                mockLogger.info(
                  `Proactively prefetching next page: ${nextPage}`,
                );
                const nextPageData = (await generatePayload(
                  {
                    type: "array",
                    items: itemSchema,
                  },
                  effectiveLimit,
                )) as unknown[];
                setCachedPageData(
                  route.id,
                  nextPage,
                  effectiveLimit,
                  nextPageData,
                );
                prunePageCache(route.id, pageValue, effectiveLimit);
              }
            } catch (prefetchError) {
              mockLogger.error("Background prefetch failed:", prefetchError);
            }
          });
        } else {
          rawPayload = (await generatePayload(
            {
              type: "array",
              items: itemSchema,
            },
            effectiveLimit,
          )) as unknown[];
        }
      } else {
        if (cachingEnabled) {
          const requiredItemsCount = pageValue * effectiveLimit;
          let cachedArray = getCachedMockData(route.id);
          isFromCache = true;
          if (!cachedArray) {
            cachedArray = [];
            isFromCache = false;
          }

          if (cachedArray.length < requiredItemsCount) {
            isFromCache = false;
            const deficit = requiredItemsCount - cachedArray.length;
            const generationCount = Math.max(
              100,
              Math.ceil(deficit / 100) * 100,
            );

            const newItems = (await generatePayload(
              {
                type: "array",
                items: itemSchema,
              },
              generationCount,
            )) as unknown[];

            cachedArray = [...cachedArray, ...newItems];
            setCachedMockData(route.id, cachedArray);
          }

          rawPayload = cachedArray;
        } else {
          const requiredItemsCount = pageValue * effectiveLimit;
          rawPayload = (await generatePayload(
            {
              type: "array",
              items: itemSchema,
            },
            requiredItemsCount,
          )) as unknown[];
        }
      }
    } else {
      if (cachingEnabled) {
        let cachedObject = getCachedSingleMockData(route.id);
        isFromCache = true;
        if (!cachedObject) {
          isFromCache = false;
          cachedObject = await generatePayload(schema, limitValue);
          setCachedSingleMockData(route.id, cachedObject);
        }
        rawPayload = cachedObject;
      } else {
        rawPayload = await generatePayload(schema, limitValue);
      }
    }

    let payload: unknown;
    if (isArrayResponse && isPagedRequest) {
      const paramsForProcessing = new URLSearchParams(searchParams);
      paramsForProcessing.delete("page");
      paramsForProcessing.delete("_page");
      paramsForProcessing.delete("limit");
      paramsForProcessing.delete("_limit");
      paramsForProcessing.delete("count");
      payload = processQueryParameters(rawPayload, paramsForProcessing);
    } else {
      payload = processQueryParameters(rawPayload, searchParams);
    }

    // ── 7. Parse Custom Headers ──────────────────────────────────────────
    let customHeaders: Record<string, string> = {};
    try {
      customHeaders = JSON.parse(route.customHeaders ?? "{}");
    } catch {
      mockLogger.warn(`Invalid custom headers for route ${route.id}`);
    }

    // ── 8. Wrap Response using SOLID Formatter Factory ───────────────────
    const latency = Date.now() - startTime;
    const queryRecord: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      queryRecord[key] = value;
    }

    let formatterType: "single" | "list" | "paged" = "single";
    if (isArrayResponse) {
      if (pageParam !== null) {
        formatterType = "paged";
      } else {
        formatterType = "list";
      }
    }

    const effectiveLimit = limitValue !== undefined ? limitValue : 10;
    const totalCount = isArrayResponse
      ? isPagedRequest
        ? Math.max(100, (pageValue + 1) * effectiveLimit)
        : cachingEnabled
          ? (getCachedMockData(route.id)?.length ?? 0)
          : effectiveLimit
      : undefined;

    const formatter = MockResponseFormatterFactory.getFormatter(formatterType);
    const wrappedPayload = formatter.format(payload, {
      routeId: route.id,
      projectId: project.id,
      statusCode: route.statusCode,
      success: route.statusCode >= 200 && route.statusCode < 300,
      isFromCache,
      latency,
      method: request.method,
      path: requestPath,
      query: queryRecord,
      limitValue:
        limitValue !== undefined
          ? limitValue
          : isArrayResponse
            ? 10
            : undefined,
      pageValue,
      totalCount,
    });

    const response = buildResponse(
      wrappedPayload,
      route.statusCode,
      customHeaders,
    );
    after(() => log(route.statusCode, route.statusCode >= 400, wrappedPayload));
    mockCoreTrace.traceSuccess(
      "processMockRequest (successful mock response)",
      response.status,
    );
    return response;
  } catch (error) {
    mockCoreTrace.traceError("processMockRequest", error);
    const errBody = { error: true, message: "Internal mock server error" };
    const response = buildErrorResponse(500, errBody.message);
    after(() => log(500, true, errBody));
    return response;
  }
}
